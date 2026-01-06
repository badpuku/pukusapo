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
