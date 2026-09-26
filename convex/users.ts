import { createClerkClient } from "@clerk/backend";
import { ConvexError } from "convex/values";
import type { UserIdentity } from "convex/server";
import { v, type Infer } from "convex/values";
import { internal } from "./_generated/api";
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
  firstName: v.string(),
  lastName: v.string(),
  username: v.string(),
  imageUrl: v.string(),
});

type ClerkUserData = Infer<typeof clerkUserData>;

export const getUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const get = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getRecentUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").order("desc").take(5);
  },
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
      await ctx.db.insert("users", {
        ...data,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.patch(user._id, {
        ...data,
        updatedAt: Date.now(),
      });
    }
  },
});

export const deleteFromClerk = internalMutation({
  args: { clerkUserId: v.string() },
  async handler(ctx, { clerkUserId }) {
    const user = await userByClerkUserId(ctx, clerkUserId);

    if (user !== null) {
      await ctx.db.delete(user._id);
    }
  },
});

export async function getCurrentUserOrThrow(ctx: QueryCtx) {
  const userRecord = await getCurrentUser(ctx);
  if (!userRecord) throw new Error("Can't get current user");
  return userRecord;
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

function dataFromIdentity(identity: UserIdentity): ClerkUserData {
  return {
    clerkUserId: identity.subject,
    email: identity.email ?? "",
    firstName: identity.givenName ?? "",
    lastName: identity.familyName ?? "",
    username: identity.nickname ?? identity.preferredUsername ?? "",
    imageUrl: identity.pictureUrl ?? "",
  };
}