import { httpRouter } from "convex/server";
import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/nextjs/server";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

const http = httpRouter();

// Type for user roles
type UserRole = "donor" | "admin" | "hospital" | "ngo";

// Type for unsafe_metadata with role
interface UnsafeMetadata {
  role?: UserRole;
  [key: string]: unknown;
}

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("Missing CLERK_WEBHOOK_SECRET");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    // Get headers
    const svix_id = request.headers.get("svix-id");
    const svix_timestamp = request.headers.get("svix-timestamp");
    const svix_signature = request.headers.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new Response("Missing svix headers", { status: 400 });
    }

    // Get body
    const payload = await request.text();

    // Verify webhook signature
    const wh = new Webhook(webhookSecret);
    let evt: WebhookEvent;

    try {
      evt = wh.verify(payload, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as WebhookEvent;
    } catch (err) {
      console.error("Webhook verification failed:", err);
      return new Response("Webhook verification failed", { status: 400 });
    }

    // Handle the webhook
    const eventType = evt.type;

    if (eventType === "user.created" || eventType === "user.updated") {
      const { id, email_addresses, first_name, last_name, unsafe_metadata } =
        evt.data;

      const email = email_addresses[0]?.email_address;
      const name = `${first_name || ""} ${last_name || ""}`.trim() || "User";
      
      // Type-safe handling of unsafe_metadata
      const metadata = unsafe_metadata as UnsafeMetadata | undefined;
      const role: UserRole = metadata?.role || "donor";

      try {
        await ctx.runMutation(internal.users.createUser, {
          clerkId: id,
          email: email,
          name: name,
          role: role,
        });

        console.log(`User ${eventType}:`, { id, email, role });
        return new Response("Success", { status: 200 });
      } catch (error) {
        console.error("Error creating/updating user:", error);
        return new Response("Internal server error", { status: 500 });
      }
    }

    return new Response("Event type not handled", { status: 200 });
  }),
});

export default http;