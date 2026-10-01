import { ConvexError } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import {
  internalMutation,
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { requireUserId } from "./users";
import { meetingStatus, type MeetingStatus } from "./validators";

const DEFAULT_UPCOMING_LIMIT = 10;
const MAX_TAKE = 100;

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    status: v.optional(meetingStatus),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const { status } = args;

    if (status !== undefined) {
      return await ctx.db
        .query("meetings")
        .withIndex("by_userId_and_status", (q) =>
          q.eq("userId", userId).eq("status", status),
        )
        .order("desc")
        .paginate(args.paginationOpts);
    }

    return await ctx.db
      .query("meetings")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const get = query({
  args: { meetingId: v.id("meetings") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const meeting = await getOwnedMeeting(ctx, args.meetingId, userId);
    const agent = await ctx.db.get(meeting.agentId);
    return { ...meeting, agentName: agent?.name ?? null };
  },
});

export const active = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const meeting = await ctx.db
      .query("meetings")
      .withIndex("by_userId_and_status", (q) =>
        q.eq("userId", userId).eq("status", "active"),
      )
      .first();
    return meeting;
  },
});

export const upcoming = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const limit = clampTake(args.limit, DEFAULT_UPCOMING_LIMIT);
    return await ctx.db
      .query("meetings")
      .withIndex("by_userId_and_status", (q) =>
        q.eq("userId", userId).eq("status", "upcoming"),
      )
      .order("desc")
      .take(limit);
  },
});

export const byAgent = query({
  args: {
    agentId: v.id("agents"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    return await ctx.db
      .query("meetings")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const schedule = mutation({
  args: {
    name: v.optional(v.string()),
    agentId: v.id("agents"),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const agent = await ctx.db.get(args.agentId);
    if (agent === null || agent.userId !== userId) {
      throw new ConvexError({ code: "not_found", message: "Agent not found" });
    }

    const name = args.name?.trim();
    return await ctx.db.insert("meetings", {
      userId,
      agentId: args.agentId,
      name: name && name.length > 0 ? name : agent.name,
      status: "upcoming",
      updatedAt: Date.now(),
    });
  },
});

export const start = mutation({
  args: { meetingId: v.id("meetings") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const meeting = await getOwnedMeeting(ctx, args.meetingId, userId);

    if (meeting.status === "active") {
      return null;
    }
    assertTransition(meeting.status, ["upcoming"], "start");

    await ctx.db.patch(meeting._id, {
      status: "active",
      startedAt: meeting.startedAt ?? Date.now(),
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const end = mutation({
  args: { meetingId: v.id("meetings") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const meeting = await getOwnedMeeting(ctx, args.meetingId, userId);

    if (meeting.status === "completed") {
      return null;
    }
    assertTransition(meeting.status, ["active", "processing"], "end");

    await ctx.db.patch(meeting._id, {
      status: "completed",
      endedAt: meeting.endedAt ?? Date.now(),
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const cancel = mutation({
  args: { meetingId: v.id("meetings") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const meeting = await getOwnedMeeting(ctx, args.meetingId, userId);

    assertTransition(meeting.status, ["upcoming", "active"], "cancel");

    await ctx.db.patch(meeting._id, {
      status: "cancelled",
      endedAt: Date.now(),
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const remove = mutation({
  args: { meetingId: v.id("meetings") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const meeting = await getOwnedMeeting(ctx, args.meetingId, userId);

    if (meeting.status === "active" || meeting.status === "processing") {
      throw new ConvexError({
        code: "meeting_live",
        message: "End the meeting before deleting it",
      });
    }

    await ctx.db.delete(meeting._id);
    return null;
  },
});

/**
 * Called by the recording/transcript pipeline, not by the browser.
 */
export const applyArtifacts = internalMutation({
  args: {
    meetingId: v.id("meetings"),
    status: v.optional(meetingStatus),
    transcriptUrl: v.optional(v.string()),
    recordingUrl: v.optional(v.string()),
    summary: v.optional(v.string()),
    endedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const meeting = await ctx.db.get(args.meetingId);
    if (meeting === null) {
      return null;
    }

    const patch: {
      status?: MeetingStatus;
      transcriptUrl?: string;
      recordingUrl?: string;
      summary?: string;
      endedAt?: number;
      updatedAt: number;
    } = { updatedAt: Date.now() };

    if (args.status !== undefined) {
      patch.status = args.status;
    }
    if (args.transcriptUrl !== undefined) {
      patch.transcriptUrl = args.transcriptUrl;
    }
    if (args.recordingUrl !== undefined) {
      patch.recordingUrl = args.recordingUrl;
    }
    if (args.summary !== undefined) {
      patch.summary = args.summary;
    }
    if (args.endedAt !== undefined) {
      patch.endedAt = args.endedAt;
    }

    await ctx.db.patch(meeting._id, patch);
    return null;
  },
});

async function getOwnedMeeting(
  ctx: QueryCtx | MutationCtx,
  meetingId: Id<"meetings">,
  userId: Id<"users">,
): Promise<Doc<"meetings">> {
  const meeting = await ctx.db.get(meetingId);
  if (meeting === null || meeting.userId !== userId) {
    throw new ConvexError({ code: "not_found", message: "Meeting not found" });
  }
  return meeting;
}

function clampTake(requested: number | undefined, fallback: number): number {
  if (requested === undefined || !Number.isFinite(requested)) {
    return fallback;
  }
  return Math.min(Math.max(Math.floor(requested), 1), MAX_TAKE);
}

function assertTransition(
  from: Doc<"meetings">["status"],
  allowed: Doc<"meetings">["status"][],
  action: string,
) {
  if (!allowed.includes(from)) {
    throw new ConvexError({
      code: "invalid_transition",
      message: `Cannot ${action} a meeting that is ${from}`,
    });
  }
}
