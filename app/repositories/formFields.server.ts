import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "~/models/supabase";

/**
 * フォームIDを指定してフォーム項目を取得
 *
 * @param supabase - Supabaseクライアント
 * @param formId - フォームID
 * @returns フォームデータまたはエラー
 */
export async function findFieldsByFormId(
  supabase: SupabaseClient<Database>,
  formId: string,
) {
  return supabase
    .from("form_fields")
    .select("*")
    .eq("form_id", formId)
    .order("display_order", { ascending: true });
}

/**
 * フォーム項目を作成
 *
 * @param supabase - Supabaseクライアント
 * @param data - フォーム項目作成データ
 * @returns 作成されたフォーム項目またはエラー
 */
export async function createField(
  supabase: SupabaseClient<Database>,
  data: Database["public"]["Tables"]["form_fields"]["Insert"],
) {
  return supabase.from("form_fields").insert(data).select().single();
}

/**
 * フォーム項目を更新
 *
 * @param supabase - Supabaseクライアント
 * @param id - フォーム項目ID
 * @param data - フォーム項目更新データ
 * @returns 更新されたフォーム項目またはエラー
 */
export async function updateField(
  supabase: SupabaseClient<Database>,
  fieldId: string,
  data: Database["public"]["Tables"]["form_fields"]["Update"],
) {
  return supabase.from("form_fields").update(data).eq("id", fieldId).select().single();
}

/**
 * フォーム項目を削除
 *
 * @param supabase - Supabaseクライアント
 * @param fieldId - フォーム項目ID
 * @returns 削除されたフォーム項目またはエラー
 */
export async function deleteField(
  supabase: SupabaseClient<Database>,
  fieldId: string,
) {
  return supabase.from("form_fields").delete().eq("id", fieldId);
}
