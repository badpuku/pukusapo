import { verifyWebhook } from "@clerk/react-router/webhooks";

import { createDatabaseClient } from "~/db/client.server";
import { createProfile } from "~/db/queries/profiles";
import { type NewProfile } from "~/db/schema/profiles";

import type { Route } from "./+types/route";

export const action = async ({ request, context }: Route.ActionArgs) => {
  try {
    const evt = await verifyWebhook(request, {
      signingSecret: context.cloudflare.env.CLERK_WEBHOOK_SIGNING_SECRET,
    });

    const db = createDatabaseClient(context.cloudflare.env);

    if (evt.type === "user.created") {
      const profile: NewProfile = {
        userId: evt.data.id,
        name:
          evt.data.first_name && evt.data.last_name
            ? `${evt.data.first_name} ${evt.data.last_name}`.trim()
            : evt.data.username || `user_${evt.data.id}`,
        email: evt.data.email_addresses?.[0]?.email_address || null,
      };

      try {
        await createProfile(db)(profile);
        console.log("Profile created successfully:", profile);
      } catch (error) {
        console.error("Error creating profile:", error);
        return new Response("Error creating profile", { status: 500 });
      }
    }

    return new Response("Webhook received", { status: 200 });
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error verifying webhook", { status: 400 });
  }
};
