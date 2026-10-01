import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { requireUserId } from "./users";

/**
 * `session.token` is a short lived bearer credential (a Gemini Live ephemeral
 * token), so it is only ever written or read by server code. Public queries
 * here return metadata without the token.
 */

const DEFAULT_LIMIT = 20;
const MAX_TAKE = 100;

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const limit = clampTake(args.limit, DEFAULT_LIMIT);
    const sessions = await ctx.db
      .query("session")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);

    // No wall-clock read here: a query is not re-run as time advances, so an
    // expiry computed inside one would go stale. The caller compares
    // `expiresAt` against its own clock.
    return sessions.map(({ _id, description, expiresAt, userAgent, _creationTime }) => ({
      sessionId: _id,
      description: description ?? null,
      expiresAt,
      userAgent: userAgent ?? null,
      createdAt: _creationTime,
    }));
  },
});

export const revokeAll = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const sessions = await ctx.db
      .query("session")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(MAX_TAKE);
    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }
    return sessions.length;
  },
});

export const save = internalMutation({
  args: {
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
    description: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("session", { ...args, updatedAt: Date.now() });
  },
});

export const getToken = internalQuery({
  args: { sessionId: v.id("session"), now: v.number() },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (session === null || session.expiresAt <= args.now) {
      return null;
    }
    return session.token;
  },
});

export const pruneExpired = internalMutation({
  args: {},
  handler: async (ctx) => {
    const batch = await ctx.db
      .query("session")
      .withIndex("by_expiresAt", (q) => q.lte("expiresAt", Date.now()))
      .take(500);
    for (const session of batch) {
      await ctx.db.delete(session._id);
    }
    return batch.length;
  },
});

function clampTake(requested: number | undefined, fallback: number): number {
  if (requested === undefined || !Number.isFinite(requested)) {
    return fallback;
  }
  return Math.min(Math.max(Math.floor(requested), 1), MAX_TAKE);
}
