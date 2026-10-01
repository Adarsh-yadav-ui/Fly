import { v, type Infer } from "convex/values";

/**
 * Shared so the schema and the functions can never drift apart.
 */
export const meetingStatus = v.union(
  v.literal("upcoming"),
  v.literal("active"),
  v.literal("processing"),
  v.literal("completed"),
  v.literal("cancelled"),
);

export type MeetingStatus = Infer<typeof meetingStatus>;
