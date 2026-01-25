import type { SupabaseClient } from "@supabase/supabase-js";

import {
  ERROR_CODES,
  ERROR_MESSAGES_MAP,
  ERROR_STATUS_MAP,
} from "~/constants/errors";
import {
  type ApiResponse,
  createErrorResponse,
  createSuccessResponse,
} from "~/lib/apiResponse";
import { type FieldInput } from "~/models/formFields";
import type { Database } from "~/models/supabase";
import { createFields as createFieldsRepository } from "~/repositories/formFields.server";
import {
  type FormFieldsResponse,
  FormFieldsResponseSchema,
} from "~/services/formFields/schemas";

/**
 * フォーム項目を作成する
 *
 * @param supabase - Supabaseクライアント
 * @param formFields - フォーム項目データ
 * @returns 作成されたフォーム項目データまたはエラー
 */
export async function createFields(
  supabase: SupabaseClient<Database>,
  formFields: FieldInput[],
): Promise<ApiResponse<FormFieldsResponse[]>> {
  // フォーム項目データ作成
  const { data: formFieldsData, error: formFieldsError } =
    await createFieldsRepository(supabase, formFields.map((field) => ({
      form_id: field.formId,
      field_type: field.fieldType,
      label: field.label,
      description: field.description,
      is_required: field.isRequired,
      display_order: field.displayOrder,
      validation_rules: field.validationRules,
      field_options: field.fieldOptions,
    })));

  // フォーム項目データ作成エラーチェック
  if (formFieldsError) {
    return createErrorResponse(
      ERROR_CODES.DATABASE_ERROR,
      `[Supabase Error] ${formFieldsError.code}: ${formFieldsError.message}`,
      ERROR_STATUS_MAP[ERROR_CODES.DATABASE_ERROR],
    );
  }

  // フォーム項目データ作成バリデーション
  const result = FormFieldsResponseSchema.array().safeParse(formFieldsData);
  if (!result.success) {
    return createErrorResponse(
      ERROR_CODES.VALIDATION_ERROR,
      ERROR_MESSAGES_MAP[ERROR_CODES.VALIDATION_ERROR],
      ERROR_STATUS_MAP[ERROR_CODES.VALIDATION_ERROR],
    );
  }

  return createSuccessResponse(result.data);
}
