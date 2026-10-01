// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { meetingStatus } from "./validators";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    clerkUserId: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    username: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    updatedAt: v.optional(v.number()),
  })
    .index("byClerkUserId", ["clerkUserId"])
    .index("byEmail", ["email"]),

  session: defineTable({
    userId: v.id("users"),
    token: v.string(),
    description: v.optional(v.string()),
    expiresAt: v.number(),
    userAgent: v.optional(v.string()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_expiresAt", ["expiresAt"]),

  agents: defineTable({
    userId: v.id("users"),
    name: v.string(),
    instructions: v.string(),
    updatedAt: v.optional(v.number()),
  }).index("by_userId", ["userId"]),

  meetings: defineTable({
    name: v.string(),
    userId: v.id("users"),
    agentId: v.id("agents"),
    status: meetingStatus,
    startedAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),
    transcriptUrl: v.optional(v.string()),
    recordingUrl: v.optional(v.string()),
    summary: v.optional(v.string()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_status", ["userId", "status"])
    .index("by_agentId", ["agentId"])
    .index("by_status", ["status"]),
});
