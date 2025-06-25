// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
// import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { verifyWebhook } from "npm:@clerk/backend/webhooks";
import { createClient } from "npm:@supabase/supabase-js";

interface WebhookEvent {
  data: {
    id: string;
    first_name?: string;
    last_name?: string;
    name?: string;
    image_url?: string;
    email_addresses?: Array<{
      email_address: string;
      verification: {
        status: string;
      };
    }>;
    primary_email_address_id?: string;
    public_metadata?: Record<string, unknown>;
    unsafe_metadata?: Record<string, unknown>;
    created_at: number;
    updated_at: number;
    // Organization data
    organization?: {
      id: string;
      name: string;
      created_at: number;
      updated_at: number;
    };
    // Public user data for org membership
    public_user_data?: {
      user_id: string;
      first_name?: string;
      last_name?: string;
      image_url?: string;
      email_address?: string;
    };
  };
  object: "event";
  type: string;
}

Deno.serve(async (req) => {
  console.log("🚀 Webhook received:", req.method, req.url);

  try {
    // Verify webhook signature
    const webhookSecret = Deno.env.get("CLERK_WEBHOOK_SECRET");
    console.log("🔐 Webhook secret exists:", !!webhookSecret);

    if (!webhookSecret) {
      console.error("❌ Webhook secret not configured");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    console.log("🔍 Verifying webhook signature...");
    const event = await verifyWebhook(req, { signingSecret: webhookSecret });
    console.log("✅ Webhook signature verified, event type:", event.type);

    // Create supabase client
    const supabaseUrl =
      Deno.env.get("FUNCTIONS_SUPABASE_URL") ||
      "http://host.docker.internal:54321";
    const supabaseServiceKey = Deno.env.get(
      "FUNCTIONS_SUPABASE_SERVICE_ROLE_KEY",
    );

    console.log("🔗 Supabase URL:", supabaseUrl);
    console.log("🔑 Service key exists:", !!supabaseServiceKey);
    console.log("🔑 Service key length:", supabaseServiceKey?.length || 0);

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ Supabase credentials not configured");
      return new Response("Supabase credentials not configured", {
        status: 500,
      });
    }

    console.log("🏗️ Creating Supabase client...");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log("✅ Supabase client created");

    switch (event.type) {
      case "user.created": {
        console.log(
          "👤 Processing user.created event for user:",
          event.data.id,
        );

        // Handle user creation - RLSをバイパスするためにService Role権限を明示的に使用
        const { error } = await supabase.from("profiles").insert([
          {
            user_id: event.data.id,
            name: event.data.first_name + " " + event.data.last_name,
            created_at: new Date(event.data.created_at).toISOString(),
            updated_at: new Date(event.data.updated_at).toISOString(),
          },
        ]);

        if (error) {
          console.error("❌ Error creating user:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
          });
        }

        console.log("✅ User created successfully");
        return new Response(JSON.stringify({ success: true }), { status: 200 });
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
        // Unhandled event type
        console.log("⚠️ Unhandled event type:", event.type);
        console.log("📄 Full event:", JSON.stringify(event, null, 2));
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }
    }
  } catch (error: unknown) {
    console.error("💥 Webhook processing error:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorName = error instanceof Error ? error.name : "Unknown";
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error("📋 Error details:", {
      name: errorName,
      message: errorMessage,
      stack: errorStack,
    });

    // 401エラーの場合は詳細をログ出力
    if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
      console.error("🚫 401 Unauthorized error detected");
      console.error("🔍 This could be due to:");
      console.error("  - Invalid webhook signature");
      console.error("  - Invalid Supabase service role key");
      console.error("  - Missing or incorrect environment variables");
    }

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: errorMessage,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});
