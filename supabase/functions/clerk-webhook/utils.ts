import { UserJSON } from "npm:@clerk/backend";
import { createClient } from "npm:@supabase/supabase-js";
import { DatabaseCredentials } from "./types.ts";

export const getFullName = (data: UserJSON): string => {
  return [data.first_name, data.last_name].filter(Boolean).join(" ") || data.id;
};

export const getDatabaseCredentials = (): DatabaseCredentials => {
  const supabaseUrl =
    Deno.env.get("FUNCTIONS_SUPABASE_URL") ||
    "http://host.docker.internal:54321";
  const supabaseServiceKey = Deno.env.get(
    "FUNCTIONS_SUPABASE_SERVICE_ROLE_KEY",
  );

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase credentials not configured");
  }

  return { supabaseUrl, supabaseServiceKey };
};

export const createSupabaseClient = (credentials: DatabaseCredentials) => {
  return createClient(credentials.supabaseUrl, credentials.supabaseServiceKey);
};

export const getWebhookSecret = (): string => {
  const webhookSecret = Deno.env.get("CLERK_WEBHOOK_SECRET");
  
  if (!webhookSecret) {
    throw new Error("Webhook secret not configured");
  }
  
  return webhookSecret;
};