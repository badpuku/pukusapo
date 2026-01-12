import { getAuth } from "@clerk/react-router/ssr.server";
import type { LoaderFunctionArgs } from "react-router";

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
import { findFormById, findFormByIdWithFields } from "~/repositories/forms.server";
import {
  type FormResponse,
  FormResponseSchema,
  type FormWithFieldsResponse,
  FormWithFieldsResponseSchema,
} from "~/services/forms/schemas";
import { createServerSupabaseClient } from "~/services/supabase/client.server";

/**
 * IDを指定してフォームを取得する
 */
export async function getFormById(
  args: LoaderFunctionArgs,
  formId: string,
): Promise<ApiResponse<FormResponse>> {
  const auth = await getAuth(args);
  const userId = auth.userId;

  // 認証チェック
  if (!userId) {
    return createErrorResponse(
      ERROR_CODES.UNAUTHORIZED,
      ERROR_MESSAGES_MAP[ERROR_CODES.UNAUTHORIZED],
      ERROR_STATUS_MAP[ERROR_CODES.UNAUTHORIZED],
    );
  }

  // フォームデータ取得
  const supabase = createServerSupabaseClient(args);
  const { data: form, error: formError } = await findFormById(supabase, formId);

  // フォームデータ取得エラーチェック
  if (formError) {
    return createErrorResponse(
      ERROR_CODES.DATABASE_ERROR,
      `[Supabase Error] ${formError.code}: ${formError.message}`,
      ERROR_STATUS_MAP[ERROR_CODES.DATABASE_ERROR],
    );
  }

  // フォームデータバリデーション
  const formData = FormResponseSchema.safeParse(form);
  if (!formData.success) {
    return createErrorResponse(
      ERROR_CODES.VALIDATION_ERROR,
      ERROR_MESSAGES_MAP[ERROR_CODES.VALIDATION_ERROR],
      ERROR_STATUS_MAP[ERROR_CODES.VALIDATION_ERROR],
    );
  }

  return createSuccessResponse(formData.data);
}

export async function getFormByIdWithFields(
  args: LoaderFunctionArgs,
  formId: string,
): Promise<ApiResponse<FormWithFieldsResponse>> {
  const auth = await getAuth(args);
  const userId = auth.userId;

  // 認証チェック
  if (!userId) {
    return createErrorResponse(
      ERROR_CODES.UNAUTHORIZED,
      ERROR_MESSAGES_MAP[ERROR_CODES.UNAUTHORIZED],
      ERROR_STATUS_MAP[ERROR_CODES.UNAUTHORIZED],
    );
  }

  // フォームデータ取得
  const supabase = createServerSupabaseClient(args);
  const { data: form, error: formError } = await findFormByIdWithFields(
    supabase,
    formId,
  );

  // フォームデータ取得エラーチェック
  if (formError) {
    return createErrorResponse(
      ERROR_CODES.DATABASE_ERROR,
      `[Supabase Error] ${formError.code}: ${formError.message}`,
      ERROR_STATUS_MAP[ERROR_CODES.DATABASE_ERROR],
    );
  }

  // フォームデータバリデーション
  const formData = FormWithFieldsResponseSchema.safeParse(form);
  if (!formData.success) {
    return createErrorResponse(
      ERROR_CODES.VALIDATION_ERROR,
      ERROR_MESSAGES_MAP[ERROR_CODES.VALIDATION_ERROR],
      ERROR_STATUS_MAP[ERROR_CODES.VALIDATION_ERROR],
    );
  }

  return createSuccessResponse(formData.data);
}
