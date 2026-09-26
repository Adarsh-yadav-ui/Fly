import { httpRouter } from "convex/server";
import { env, httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { WebhookEvent } from "@clerk/backend";
import { Webhook } from "svix";

const http = httpRouter();

http.route({
  path: "/clerk-users-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const event = await validateRequest(request);
    if (event === null) {
      return new Response("Invalid webhook", { status: 400 });
    }

    switch (event.type) {
      case "user.created":
      case "user.updated": {
        const { data } = event;
        const primaryEmail = data.email_addresses.find(
          (email) => email.id === data.primary_email_address_id,
        );
        await ctx.runMutation(internal.users.upsertFromClerk, {
          data: {
            clerkUserId: data.id,
            email: primaryEmail?.email_address ?? "",
            firstName: data.first_name ?? "",
            lastName: data.last_name ?? "",
            username: data.username ?? "",
            imageUrl: data.image_url ?? "",
          },
        });
        break;
      }

      case "user.deleted": {
        const clerkUserId = event.data.id;
        if (clerkUserId !== undefined) {
          await ctx.runMutation(internal.users.deleteFromClerk, { clerkUserId });
        }
        break;
      }

      default:
        console.log("Ignored Clerk webhook event", event.type);
    }

    return new Response(null, { status: 200 });
  }),
});

function isWebhookEvent(value: unknown): value is WebhookEvent {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    typeof value.type === "string"
  );
}

async function validateRequest(req: Request): Promise<WebhookEvent | null> {
  const signingSecret = env.CLERK_WEBHOOK_SECRET;
  if (signingSecret === undefined) {
    console.error("CLERK_WEBHOOK_SECRET is not set on this Convex deployment");
    return null;
  }

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");
  if (svixId === null || svixTimestamp === null || svixSignature === null) {
    return null;
  }

  const payloadString = await req.text();
  const wh = new Webhook(signingSecret);
  try {
    const event = wh.verify(payloadString, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
    return isWebhookEvent(event) ? event : null;
  } catch (error) {
    console.error("Error verifying webhook event", error);
    return null;
  }
}

export default http;
