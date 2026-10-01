import { createClerkClient } from "@clerk/backend";
import { ConvexError } from "convex/values";
import type { UserIdentity } from "convex/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  action,
  env,
  internalMutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";

const clerkUserData = v.object({
  clerkUserId: v.string(),
  email: v.string(),
  firstName: v.optional(v.string()),
  lastName: v.optional(v.string()),
  username: v.optional(v.string()),
  imageUrl: v.optional(v.string()),
});

export const current = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

export const upsertFromClerk = internalMutation({
  args: { data: clerkUserData },
  async handler(ctx, { data }) {
    const user = await userByClerkUserId(ctx, data.clerkUserId);

    if (user === null) {
      await ctx.db.insert("users", { ...data, updatedAt: Date.now() });
    } else {
      await ctx.db.patch(user._id, { ...data, updatedAt: Date.now() });
    }
  },
});

export const deleteFromClerk = internalMutation({
  args: { clerkUserId: v.string() },
  async handler(ctx, { clerkUserId }) {
    const user = await userByClerkUserId(ctx, clerkUserId);
    if (user === null) {
      return;
    }

    await ctx.db.delete(user._id);

    // A user can own more sessions, agents, and meetings than fit in a single
    // transaction, so the remainder is swept in bounded batches.
    await ctx.scheduler.runAfter(0, internal.users.purgeUserData, {
      userId: user._id,
    });
  },
});

const PURGE_BATCH_SIZE = 100;

export const purgeUserData = internalMutation({
  args: { userId: v.id("users") },
  async handler(ctx, { userId }) {
    const sessions = await ctx.db
      .query("session")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(PURGE_BATCH_SIZE);
    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }
    if (sessions.length === PURGE_BATCH_SIZE) {
      await ctx.scheduler.runAfter(0, internal.users.purgeUserData, { userId });
      return;
    }

    const agents = await ctx.db
      .query("agents")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(PURGE_BATCH_SIZE);
    for (const agent of agents) {
      await ctx.db.delete(agent._id);
    }
    if (agents.length === PURGE_BATCH_SIZE) {
      await ctx.scheduler.runAfter(0, internal.users.purgeUserData, { userId });
      return;
    }

    const meetings = await ctx.db
      .query("meetings")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(PURGE_BATCH_SIZE);
    for (const meeting of meetings) {
      await ctx.db.delete(meeting._id);
    }
    if (meetings.length === PURGE_BATCH_SIZE) {
      await ctx.scheduler.runAfter(0, internal.users.purgeUserData, { userId });
    }
  },
});

/**
 * Clerk's session token for Convex only carries the user id, so the profile
 * fields have to be read from Clerk's Backend API instead of the JWT.
 */
export const sync = action({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Called sync without authentication present");
    }

    const secretKey = env.CLERK_SECRET_KEY;
    if (secretKey === undefined) {
      console.warn(
        "CLERK_SECRET_KEY is not set on this Convex deployment; falling back to JWT claims",
      );
      await ctx.runMutation(internal.users.upsertFromClerk, {
        data: dataFromIdentity(identity),
      });
      return;
    }

    const clerk = createClerkClient({ secretKey });
    let clerkUser;
    try {
      clerkUser = await clerk.users.getUser(identity.subject);
    } catch (error) {
      const { status, clerkTraceId, longMessage, errors } = error as {
        status?: number;
        clerkTraceId?: string;
        longMessage?: string;
        errors?: { message?: string }[];
      };
      const message =
        longMessage ?? errors?.map((item) => item.message).join("; ");
      console.error("Clerk Backend API request failed", {
        subject: identity.subject,
        status,
        clerkTraceId,
        message,
      });
      throw new ConvexError({
        code: "clerk_api_error",
        subject: identity.subject,
        status: status ?? null,
        clerkTraceId: clerkTraceId ?? null,
        message: message ?? null,
      });
    }

    await ctx.runMutation(internal.users.upsertFromClerk, {
      data: {
        clerkUserId: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress ?? "",
        firstName: clerkUser.firstName ?? "",
        lastName: clerkUser.lastName ?? "",
        username: clerkUser.username ?? "",
        imageUrl: clerkUser.imageUrl ?? "",
      },
    });
  },
});

/**
 * Resolves the caller's `users` document for functions that need it. The
 * identity always comes from the token, never from a client argument.
 * `users.current` is the exception: it is the bootstrap query and returns
 * `null` for a signed-out caller rather than throwing.
 */
export async function requireUserId(
  ctx: QueryCtx | MutationCtx,
): Promise<Id<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    throw new ConvexError({
      code: "unauthenticated",
      message: "Sign in first",
    });
  }
  const user = await userByClerkUserId(ctx, identity.subject);
  if (user === null) {
    throw new ConvexError({
      code: "profile_not_synced",
      message: "Your profile is still syncing, try again in a moment",
    });
  }
  return user._id;
}

export async function getCurrentUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    return null;
  }
  return await userByClerkUserId(ctx, identity.subject);
}

async function userByClerkUserId(
  ctx: QueryCtx | MutationCtx,
  clerkUserId: string,
) {
  return await ctx.db
    .query("users")
    .withIndex("byClerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
    .unique();
}

function dataFromIdentity(identity: UserIdentity) {
  return {
    clerkUserId: identity.subject,
    email: identity.email ?? "",
    firstName: identity.givenName ?? "",
    lastName: identity.familyName ?? "",
    username: identity.nickname ?? identity.preferredUsername ?? "",
    imageUrl: identity.pictureUrl ?? "",
  };
}
