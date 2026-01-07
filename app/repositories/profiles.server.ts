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

/**
 * フォームを作成
 *
 * @param supabase - Supabaseクライアント
 * @param data - フォーム作成データ
 * @returns 作成されたフォームまたはエラー
 */
export async function createForm(
  supabase: SupabaseClient<Database>,
  data: Database["public"]["Tables"]["forms"]["Insert"],
) {
  return supabase.from("forms").insert(data).select().single();
}

/**
 * フォームを更新
 *
 * @param supabase - Supabaseクライアント
 * @param id - フォームID
 * @param data - フォーム更新データ
 * @returns 更新されたフォームまたはエラー
 */
export async function updateForm(
  supabase: SupabaseClient<Database>,
  id: string,
  data: Database["public"]["Tables"]["forms"]["Update"],
) {
  return supabase.from("forms").update(data).eq("id", id).select().single();
}

/**
 * フォームを削除
 *
 * @param supabase - Supabaseクライアント
 * @param id - フォームID
 * @returns 削除結果またはエラー
 */
export async function deleteForm(
  supabase: SupabaseClient<Database>,
  id: string,
) {
  return supabase.from("forms").delete().eq("id", id);
}
