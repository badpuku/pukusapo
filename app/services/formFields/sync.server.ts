import type { SupabaseClient } from "@supabase/supabase-js";

import {
  ERROR_CODES,
  ERROR_STATUS_MAP,
} from "~/constants/errors";
import {
  type ApiResponse,
  createErrorResponse,
  createSuccessResponse,
} from "~/lib/apiResponse";
import type { FieldDraft } from "~/models/formFields";
import type { Database } from "~/models/supabase";
import {
  deleteField,
  findFieldsByFormId,
  updateField,
} from "~/repositories/formFields.server";
import { createFields } from "~/services/formFields/create.server";
import type { FormFieldsResponse } from "~/services/formFields/schemas";

interface FieldChange {
  toUpdate: Array<{ id: string; data: FieldDraft }>;
  toCreate: FieldDraft[];
  toDelete: string[];
}

/**
 * 既存フィールドと送信されたフィールドの差分を検出
 *
 * @param existingFields - データベースから取得した既存フィールド
 * @param submittedFields - クライアントから送信されたフィールド
 * @returns 差分検出結果（更新、作成、削除対象）
 */
function detectFieldChanges(
  existingFields: FormFieldsResponse[],
  submittedFields: FieldDraft[],
): FieldChange {
  const existingFieldIds = new Set(existingFields.map((f) => f.id));

  const toUpdate = submittedFields
    .filter((field) => field.id && existingFieldIds.has(field.id))
    .map((field) => ({
      id: field.id!,
      data: field,
    }));

  const toCreate = submittedFields.filter((field) => !field.id);

  const submittedFieldIds = new Set(
    submittedFields.filter((f) => f.id).map((f) => f.id!),
  );
  const toDelete = existingFields
    .filter((field) => !submittedFieldIds.has(field.id))
    .map((field) => field.id);

  return {
    toUpdate,
    toCreate,
    toDelete,
  };
}

/**
 * フォーム項目を同期（作成・更新・削除）
 *
 * @param supabase - Supabaseクライアント
 * @param formId - フォームID
 * @param fields - 送信されたフィールドデータ
 * @returns 最終的なフィールド一覧またはエラー
 */
export async function syncFormFields(
  supabase: SupabaseClient<Database>,
  formId: string,
  fields: FieldDraft[],
): Promise<ApiResponse<FormFieldsResponse[]>> {
  const { data: existingFields, error: findFieldsError } =
    await findFieldsByFormId(supabase, formId);

  if (findFieldsError) {
    return createErrorResponse(
      ERROR_CODES.DATABASE_ERROR,
      `[Supabase Error - findFieldsByFormId] ${findFieldsError.code}: ${findFieldsError.message}`,
      ERROR_STATUS_MAP[ERROR_CODES.DATABASE_ERROR],
    );
  }

  const fieldChanges = detectFieldChanges(existingFields || [], fields);

  // 既存フィールドの更新
  if (fieldChanges.toUpdate.length > 0) {
    const updateResults = await Promise.all(
      fieldChanges.toUpdate.map(({ id, data }) =>
        updateField(supabase, id, {
          field_type: data.fieldType,
          label: data.label,
          description: data.description || null,
          is_required: data.isRequired,
          display_order: data.displayOrder,
          validation_rules: data.validationRules || null,
          field_options: data.fieldOptions || null,
        }),
      ),
    );

    const fieldUpdateError = updateResults.find((result) => result.error);
    if (fieldUpdateError?.error) {
      return createErrorResponse(
        ERROR_CODES.DATABASE_ERROR,
        `[Supabase Error - updateField] ${fieldUpdateError.error.code}: ${fieldUpdateError.error.message}`,
        ERROR_STATUS_MAP[ERROR_CODES.DATABASE_ERROR],
      );
    }
  }

  // 新規フィールドの作成
  if (fieldChanges.toCreate.length > 0) {
    const createResponse = await createFields(
      supabase,
      fieldChanges.toCreate.map((field) => ({
        formId,
        ...field,
      })),
    );

    if (!createResponse.success) {
      return createResponse;
    }
  }

  // 不要フィールドの削除
  if (fieldChanges.toDelete.length > 0) {
    const deleteResults = await Promise.all(
      fieldChanges.toDelete.map((fieldId) => deleteField(supabase, fieldId)),
    );

    const deleteError = deleteResults.find((result) => result.error);
    if (deleteError?.error) {
      return createErrorResponse(
        ERROR_CODES.DATABASE_ERROR,
        `[Supabase Error - deleteField] ${deleteError.error.code}: ${deleteError.error.message}`,
        ERROR_STATUS_MAP[ERROR_CODES.DATABASE_ERROR],
      );
    }
  }

  const { data: finalFields } = await findFieldsByFormId(supabase, formId);

  return createSuccessResponse(finalFields || [], 200);
}
