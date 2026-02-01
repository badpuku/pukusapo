import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "~/models/supabase";

/**
 * 施設アカウントをIDで取得
 *
 * @param supabase - Supabaseクライアント
 * @param id - 施設アカウントID
 * @returns 施設アカウントデータまたはエラー
 */
export async function findFacilityAccountById(
  supabase: SupabaseClient<Database>,
  id: string,
) {
  return supabase.from("facility_accounts").select("*").eq("id", id).single();
}

/**
 * 施設アカウント一覧を取得
 *
 * @param supabase - Supabaseクライアント
 * @param options - ページネーションオプション
 * @returns 施設アカウント一覧またはエラー
 */
export async function findAllFacilityAccounts(
  supabase: SupabaseClient<Database>,
  options: { offset: number; limit: number },
) {
  return supabase
    .from("facility_accounts")
    .select("*")
    .order("created_at", { ascending: false })
    .range(options.offset, options.offset + options.limit - 1);
}

/**
 * 施設アカウントを作成
 *
 * @param supabase - Supabaseクライアント
 * @param data - 施設アカウント作成データ
 * @returns 作成された施設アカウントまたはエラー
 */
export async function createFacilityAccount(
  supabase: SupabaseClient<Database>,
  data: Database["public"]["Tables"]["facility_accounts"]["Insert"],
) {
  return supabase.from("facility_accounts").insert(data).select().single();
}

/**
 * 施設アカウントを更新
 *
 * @param supabase - Supabaseクライアント
 * @param id - 施設アカウントID
 * @param data - 施設アカウント更新データ
 * @returns 更新された施設アカウントまたはエラー
 */
export async function updateFacilityAccount(
  supabase: SupabaseClient<Database>,
  id: string,
  data: Database["public"]["Tables"]["facility_accounts"]["Update"],
) {
  return supabase
    .from("facility_accounts")
    .update(data)
    .eq("id", id)
    .select()
    .single();
}

/**
 * 施設アカウントを削除
 *
 * @param supabase - Supabaseクライアント
 * @param id - 施設アカウントID
 * @returns 削除結果またはエラー
 */
export async function deleteFacilityAccount(
  supabase: SupabaseClient<Database>,
  id: string,
) {
  return supabase.from("facility_accounts").delete().eq("id", id);
}
