// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
// import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { verifyWebhook } from "npm:@clerk/backend/webhooks";
import {
  getWebhookSecret,
  getDatabaseCredentials,
  createSupabaseClient,
} from "./utils.ts";
import {
  handleUserCreated,
  handleUserUpdated,
  handleUserDeleted,
  handleUnknownEvent,
} from "./handlers.ts";
import { handleWebhookError } from "./error-handler.ts";

Deno.serve(async (req) => {
  console.log("Webhook received:", req.method, req.url);

  try {
    // Verify webhook signature
    const webhookSecret = getWebhookSecret();
    const event = await verifyWebhook(req, { signingSecret: webhookSecret });

    // Create supabase client
    const credentials = getDatabaseCredentials();
    const supabase = createSupabaseClient(credentials);

    switch (event.type) {
      case "user.created": {
        return await handleUserCreated(event.data, supabase);
      }

      case "user.updated": {
        return await handleUserUpdated(event.data, supabase);
      }

      case "user.deleted": {
        return await handleUserDeleted(event.data, supabase);
      }

      default: {
        return handleUnknownEvent(event.type, event);
      }
    }
  } catch (error: unknown) {
    return handleWebhookError(error);
  }
});
