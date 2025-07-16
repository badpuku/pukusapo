import { UserJSON } from "npm:@clerk/backend";
import { createClient } from "npm:@supabase/supabase-js";
import { DatabaseCredentials } from "./types.ts";

export const getFullName = (data: UserJSON): string => {
  return [data.first_name, data.last_name].filter(Boolean).join(" ") || data.id;
};

/**
 * usernameがデータベース制約に適合するかチェックする
 * 制約: 英数字とハイフン、アンダースコアのみ、3文字以上30文字以下
 */
export const isValidUsername = (
  username: string | null | undefined,
): boolean => {
  if (!username) return true; // nullは許可される
  return /^[a-zA-Z0-9_-]{3,30}$/.test(username);
};

/**
 * 安全なusernameを取得する（制約に適合しない場合はnullを返す）
 */
export const getSafeUsername = (
  username: string | null | undefined,
): string | null => {
  return isValidUsername(username) ? username || null : null;
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
