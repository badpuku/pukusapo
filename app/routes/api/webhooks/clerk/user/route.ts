import { verifyWebhook } from "@clerk/react-router/webhooks";

import { createDatabaseClient } from "~/db/client";
import { createProfile } from "~/db/queries/profiles";

import type { Route } from "./+types/route";

export const action = async ({ request, context }: Route.ActionArgs) => {
  console.log("request", request);
  try {
    const evt = await verifyWebhook(request, {
      signingSecret: context.cloudflare.env.CLERK_WEBHOOK_SIGNING_SECRET,
    });

    // Do something with payload
    // For this guide, log payload to console
    const { id } = evt.data;
    const eventType = evt.type;
    console.log(
      `Received webhook with ID ${id} and event type of ${eventType}`,
    );
    console.log("Webhook payload:", evt.data);

    if (evt.type === "user.created") {
      console.log("userId:", evt.data.id);

      // 新しいDB構造を使用してprofilesテーブルにデータを挿入
      try {
        const database = createDatabaseClient(context.cloudflare.env);
        const profileCreator = createProfile(database);

        const result = await profileCreator({
          userId: evt.data.id,
          name:
            evt.data.first_name && evt.data.last_name
              ? `${evt.data.first_name} ${evt.data.last_name}`.trim()
              : evt.data.username || null,
          email: evt.data.email_addresses?.[0]?.email_address || null,
        });

        console.log("Profile created successfully:", result);
      } catch (dbError) {
        console.error("Error creating profile:", dbError);
        return new Response("Error creating profile", { status: 500 });
      }
    }

    return new Response("Webhook received", { status: 200 });
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error verifying webhook", { status: 400 });
  }
};
