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
import {
  type FormResponse,
  FormResponseSchema,
} from "~/services/forms/schemas";
import { createServerSupabaseClient } from "~/services/supabase/client.server";
import { getProfileByUserId } from "~/services/supabase/profiles";
import { hasModeratorPermission } from "~/utils/permissions";

/**
 * IDを指定してフォームを取得するサービス関数
 *
 * 認証済みユーザーが自身の作成したフォーム、またはadminが全てのフォームを取得できます。
 */
export async function getFormById(
  args: LoaderFunctionArgs,
  formId: string,
): Promise<ApiResponse<FormResponse>> {
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

  // Supabaseクライアント作成
  const supabase = createServerSupabaseClient(args);

  // プロフィール取得
  const profileResponse = await getProfileByUserId(supabase, userId);

  if (profileResponse.error || !profileResponse.data) {
    return createErrorResponse(
      ERROR_CODES.PROFILE_NOT_FOUND,
      profileResponse.error ||
        ERROR_MESSAGES_MAP[ERROR_CODES.PROFILE_NOT_FOUND],
      ERROR_STATUS_MAP[ERROR_CODES.PROFILE_NOT_FOUND],
    );
  }

  // 権限チェック
  const userProfile = profileResponse.data;
  const permissionLevel = userProfile.roles.permission_level;

  if (!hasModeratorPermission(permissionLevel)) {
    return createErrorResponse(
      ERROR_CODES.FORBIDDEN,
      ERROR_MESSAGES_MAP[ERROR_CODES.FORBIDDEN],
      ERROR_STATUS_MAP[ERROR_CODES.FORBIDDEN],
    );
  }

  // フォームデータ取得
  const { data: form, error: formError } = await supabase
    .from("forms")
    .select("*")
    .eq("id", formId)
    .single();

  if (formError) {
    // フォームが見つからない場合
    if (formError.code === "PGRST116") {
      return createErrorResponse(
        ERROR_CODES.RESOURCE_NOT_FOUND,
        "フォームが見つかりません",
        ERROR_STATUS_MAP[ERROR_CODES.RESOURCE_NOT_FOUND],
      );
    }

    return createErrorResponse(
      ERROR_CODES.DATABASE_ERROR,
      formError.message || ERROR_MESSAGES_MAP[ERROR_CODES.DATABASE_ERROR],
      ERROR_STATUS_MAP[ERROR_CODES.DATABASE_ERROR],
    );
  }

  // バリデーション
  const formData = FormResponseSchema.safeParse(form);

  if (!formData.success) {
    return createErrorResponse(
      ERROR_CODES.VALIDATION_ERROR,
      ERROR_MESSAGES_MAP[ERROR_CODES.VALIDATION_ERROR],
      ERROR_STATUS_MAP[ERROR_CODES.VALIDATION_ERROR],
    );
  }

  return createSuccessResponse(formData.data, 200);
}
