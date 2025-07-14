// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
// import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { verifyWebhook } from "npm:@clerk/backend/webhooks";
import { getWebhookSecret, getDatabaseCredentials, createSupabaseClient } from "./utils.ts";
import { handleUserCreated, handleUnknownEvent } from "./handlers.ts";
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

      /* case 'user.updated': {
        // Handle user update
        const { data: user, error } = await supabase
          .from('users')
          .update({
            first_name: event.data.first_name,
            last_name: event.data.last_name,
            avatar_url: event.data.image_url,
            updated_at: new Date(event.data.updated_at).toISOString(),
          })
          .eq('id', event.data.id)
          .select()
          .single()

        if (error) {
          console.error('Error updating user:', error)
          return new Response(JSON.stringify({ error: error.message }), { status: 500 })
        }

        return new Response(JSON.stringify({ user }), { status: 200 })
      } */

      /* case 'organization.created': {
        // Handle organization creation
        const { data, error } = await supabase
          .from('organizations')
          .insert([{
            id: event.data.id,
            name: event.data.name,
            created_at: new Date(event.data.created_at).toISOString(),
            updated_at: new Date(event.data.updated_at).toISOString(),
          }])
          .select()
          .single()

        if (error) {
          console.error('Error updating owner:', error)
          return new Response(JSON.stringify({ error: error.message }), { status: 500 })
        }

        return new Response(JSON.stringify({ data }), { status: 200 })
      } */

      /* case 'organization.updated': {
        const { data, error } = await supabase
          .from('organizations')
          .update({
            name: event.data.name,
            updated_at: new Date(event.data.updated_at).toISOString(),
          })
          .eq('id', event.data.id)
          .select()
          .single()

        if (error) {
          console.error('Error updating owner:', error)
          return new Response(JSON.stringify({ error: error.message }), { status: 500 })
        }

        return new Response(JSON.stringify({ data }), { status: 200 })
      } */

      /* case 'organizationMembership.created': {
        const { data, error } = await supabase
          .from('members')
          .insert([{
              id: event.data.id,
              user_id: event.data.public_user_data?.user_id,
              organization_id: event.data.organization?.id,
              created_at: new Date(event.data.created_at).toISOString(),
              updated_at: new Date(event.data.updated_at).toISOString(),
          }])
          .select()
          .single()

        if (error) {
          console.error('Error updating member:', error)
          return new Response(JSON.stringify({ error: error.message }), { status: 500 })
        }

        return new Response(JSON.stringify({ data }), { status: 200 })
      } */

      /* case 'organizationMembership.updated': {
        const { data, error } = await supabase
          .from('members')
          .update({
            user_id: event.data.public_user_data?.user_id,
            organization_id: event.data.organization?.id,
            updated_at: new Date(event.data.updated_at).toISOString(),
          })
          .eq('id', event.data.id)
          .select()
          .single()

        if (error) {
          console.error('Error updating member:', error)
          return new Response(JSON.stringify({ error: error.message }), { status: 500 })
        }

        return new Response(JSON.stringify({ data }), { status: 200 })
      } */

      default: {
        return handleUnknownEvent(event.type, event);
      }
    }
  } catch (error: unknown) {
    return handleWebhookError(error);
  }
});
