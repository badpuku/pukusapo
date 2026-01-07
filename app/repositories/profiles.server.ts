import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "~/models/supabase";

/**
 * ユーザーIDでプロフィールを取得
 *
 * @param supabase - Supabaseクライアント
 * @param userId - ユーザーID
 * @returns プロフィールデータまたはエラー
 */
export async function findProfileByUserId(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  return supabase
    .from("profiles")
    .select(
      `
    *,
    roles(*)
  `,
    )
    .eq("user_id", userId)
    .eq("is_active", true)
    .single();
}

/**
 * 全てのプロフィールを取得
 *
 * @param supabase - Supabaseクライアント
 * @returns プロフィール一覧またはエラー
 */
export async function findAllProfiles(supabase: SupabaseClient<Database>) {
  return supabase
    .from("profiles")
    .select(
      `
        *,
        roles(*)
      `,
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false });
}
