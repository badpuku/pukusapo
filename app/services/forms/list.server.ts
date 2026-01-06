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
import { findAllForms } from "~/repositories/forms.server";
import {
  type FormResponse,
  FormResponseSchema,
} from "~/services/forms/schemas";
import { createServerSupabaseClient } from "~/services/supabase/client.server";

/**
 * フォーム一覧を取得する
 */
export async function getFormsList(
  args: LoaderFunctionArgs,
  options: { offset?: number; limit?: number } = {},
): Promise<ApiResponse<FormResponse[]>> {
  const { offset = 0, limit = 10 } = options;

  // 認証チェック
  const auth = await getAuth(args);
  const userId = auth.userId;
  if (!userId) {
    return createErrorResponse(
      ERROR_CODES.UNAUTHORIZED,
      ERROR_MESSAGES_MAP[ERROR_CODES.UNAUTHORIZED],
      ERROR_STATUS_MAP[ERROR_CODES.UNAUTHORIZED],
    );
  }

  // フォームデータ取得
  const supabase = createServerSupabaseClient(args);
  const { data: forms, error: formsError } = await findAllForms(supabase, {
    offset,
    limit,
  });

  // フォームデータ取得エラーチェック
  if (formsError) {
    return createErrorResponse(
      ERROR_CODES.DATABASE_ERROR,
      `[Supabase Error] ${formsError.code}: ${formsError.message}`,
      ERROR_STATUS_MAP[ERROR_CODES.DATABASE_ERROR],
    );
  }

  // フォームデータバリデーション
  const result = FormResponseSchema.array().safeParse(forms);
  if (!result.success) {
    return createErrorResponse(
      ERROR_CODES.VALIDATION_ERROR,
      ERROR_MESSAGES_MAP[ERROR_CODES.VALIDATION_ERROR],
      ERROR_STATUS_MAP[ERROR_CODES.VALIDATION_ERROR],
    );
  }

  return createSuccessResponse(result.data);
}
