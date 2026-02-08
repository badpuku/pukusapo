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
    .maybeSingle();
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


/**
 * Supabase Secret Key の場合の仮の管理者プロフィールを取得する
 */
export async function findAdminProfileForSecretKey(
  supabase: SupabaseClient<Database>,
) {
  return supabase
    .from("profiles")
    .select("id, user_id, full_name, roles!inner(code)")
    .eq("full_name", "SUPABASE_管理者")
    .eq("roles.code", "admin")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();
}
