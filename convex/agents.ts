import { ConvexError } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { requireUserId } from "./users";

export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    return await ctx.db
      .query("agents")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const get = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const agent = await getOwnedAgent(ctx, args.agentId, userId);
    return agent;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    instructions: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    return await ctx.db.insert("agents", {
      userId,
      name: requireTrimmed(args.name, "name"),
      instructions: requireTrimmed(args.instructions, "instructions"),
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    agentId: v.id("agents"),
    name: v.optional(v.string()),
    instructions: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const agent = await getOwnedAgent(ctx, args.agentId, userId);

    const patch: {
      name?: string;
      instructions?: string;
      updatedAt: number;
    } = { updatedAt: Date.now() };
    if (args.name !== undefined) {
      patch.name = requireTrimmed(args.name, "name");
    }
    if (args.instructions !== undefined) {
      patch.instructions = requireTrimmed(args.instructions, "instructions");
    }

    await ctx.db.patch(agent._id, patch);
    return null;
  },
});

export const remove = mutation({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const agent = await getOwnedAgent(ctx, args.agentId, userId);

    // meetings.agentId is required, so refuse rather than orphan a history.
    const meeting = await ctx.db
      .query("meetings")
      .withIndex("by_agentId", (q) => q.eq("agentId", agent._id))
      .first();
    if (meeting !== null) {
      throw new ConvexError({
        code: "agent_in_use",
        message: "This agent still has meetings, remove them first",
      });
    }

    await ctx.db.delete(agent._id);
    return null;
  },
});

async function getOwnedAgent(
  ctx: QueryCtx | MutationCtx,
  agentId: Id<"agents">,
  userId: Id<"users">,
): Promise<Doc<"agents">> {
  const agent = await ctx.db.get(agentId);
  if (agent === null || agent.userId !== userId) {
    throw new ConvexError({ code: "not_found", message: "Agent not found" });
  }
  return agent;
}

function requireTrimmed(value: string, field: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new ConvexError({
      code: "invalid_input",
      message: `${field} cannot be empty`,
    });
  }
  return trimmed;
}
