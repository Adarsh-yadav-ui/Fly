import { defineApp } from "convex/server";
import { v } from "convex/values";

const app = defineApp({
  env: {
    CLERK_WEBHOOK_SECRET: v.optional(v.string()),
    CLERK_SECRET_KEY: v.optional(v.string()),
  },
});

export default app;
