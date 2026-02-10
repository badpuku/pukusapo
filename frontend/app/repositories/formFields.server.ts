import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "~/models/supabase";
import type { FormFieldsResponse } from "~/services/formFields/schemas";
import { FormFieldsResponseSchema } from "~/services/formFields/schemas";

/**
 * Supabase生データをFormFieldsResponse型に変換
 *
 * @param raw - データベースから取得した生データ
 * @returns 変換されたFormFieldsResponse
 * @throws {Error} バリデーションエラー時
 */
export function mapToFormFieldsResponse(
  raw: Database["public"]["Tables"]["form_fields"]["Row"],
): FormFieldsResponse {
  const parsed = FormFieldsResponseSchema.safeParse({
    id: raw.id,
    form_id: raw.form_id,
    field_type: raw.field_type,
    label: raw.label,
    description: raw.description,
    is_required: raw.is_required,
    display_order: raw.display_order,
    validation_rules: raw.validation_rules,
    field_options: raw.field_options,
  });

  if (!parsed.success) {
    throw new Error(
      `Invalid form field data (id: ${raw.id}): ${parsed.error.message}`,
    );
  }

  return parsed.data;
}

/**
 * フォームIDを指定してフォーム項目を取得
 *
 * @param supabase - Supabaseクライアント
 * @param formId - フォームID
 * @returns 型変換されたフォームフィールド配列またはエラー
 */
export async function findFieldsByFormId(
  supabase: SupabaseClient<Database>,
  formId: string,
) {
  const result = await supabase
    .from("form_fields")
    .select("*")
    .eq("form_id", formId)
    .order("display_order", { ascending: true });

  if (result.error) {
    return { data: null, error: result.error };
  }

  // 型変換を実施
  try {
    const mappedData = result.data.map(mapToFormFieldsResponse);
    return { data: mappedData, error: null };
  } catch (error) {
    // 型変換エラーを Supabase エラー形式で返す
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : "Unknown error",
        code: "MAPPING_ERROR",
        details: null,
        hint: null,
      },
    };
  }
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
 * フォーム項目を複数作成
 *
 * @param supabase - Supabaseクライアント
 * @param data - フォーム項目複数作成データ
 * @returns 作成されたフォーム項目複数またはエラー
 */
export async function createFields(
  supabase: SupabaseClient<Database>,
  data: Database["public"]["Tables"]["form_fields"]["Insert"][],
) {
  return supabase.from("form_fields").insert(data).select();
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
