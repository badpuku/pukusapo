import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "~/models/supabase";

/**
 * フォームをIDで取得
 *
 * @param supabase - Supabaseクライアント
 * @param id - フォームID
 * @returns フォームデータまたはエラー
 */
export async function findFormById(
  supabase: SupabaseClient<Database>,
  id: string,
) {
  return supabase.from("forms").select("*").eq("id", id).single();
}

export async function findFormByIdWithFields(
  supabase: SupabaseClient<Database>,
  id: string,
) {
  return supabase
    .from("forms")
    .select("*, fields:form_fields(*)")
    .eq("id", id)
    .single();
}

/**
 * フォーム一覧を取得
 *
 * @param supabase - Supabaseクライアント
 * @param options - ページネーションオプション
 * @returns フォーム一覧またはエラー
 */
export async function findAllForms(
  supabase: SupabaseClient<Database>,
  options: { offset: number; limit: number },
) {
  return supabase
    .from("forms")
    .select("*")
    .order("created_at", { ascending: false })
    .range(options.offset, options.offset + options.limit - 1);
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
