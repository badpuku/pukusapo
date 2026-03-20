import { getAuth } from "@clerk/react-router/ssr.server";
import type { LoaderFunctionArgs } from "react-router";

import { fetchMyProfile } from "~/api/profiles.server";
import {
  ERROR_CODES,
  ERROR_MESSAGES_MAP,
  ERROR_STATUS_MAP,
} from "~/constants/errors";
import { createApiClient } from "~/lib/apiClient.server";
import {
  type ApiResponse,
  createErrorResponse,
  createSuccessResponse,
} from "~/lib/apiResponse";
import type { BaseAuthContext } from "~/lib/auth/types";
import { findProfileByUserId } from "~/repositories/profiles.server";
import {
  type ProfileResponse,
  ProfileResponseSchema,
} from "~/services/profiles/schemas";
import { createServerSupabaseClient } from "~/services/supabase/client.server";

/**
 * ユーザーIDでプロフィールを取得する
 */
export async function getProfileByUserId(
  args: LoaderFunctionArgs,
  userId: string,
): Promise<ApiResponse<ProfileResponse>> {
  const auth = await getAuth(args);
  const authUserId = auth.userId;

  // 認証チェック
  if (!authUserId) {
    return createErrorResponse(
      ERROR_CODES.UNAUTHORIZED,
      ERROR_MESSAGES_MAP[ERROR_CODES.UNAUTHORIZED],
      ERROR_STATUS_MAP[ERROR_CODES.UNAUTHORIZED],
    );
  }

  // フォームデータ取得
  const supabase = createServerSupabaseClient(args);
  const { data: profile, error: profileError } = await findProfileByUserId(
    supabase,
    userId,
  );

  // フォームデータ取得エラーチェック
  if (profileError) {
    return createErrorResponse(
      ERROR_CODES.DATABASE_ERROR,
      `[Supabase Error] ${profileError.code}: ${profileError.message}`,
      ERROR_STATUS_MAP[ERROR_CODES.DATABASE_ERROR],
    );
  }

  // プロフィールが存在しない場合
  if (!profile) {
    return createErrorResponse(
      ERROR_CODES.PROFILE_NOT_FOUND,
      ERROR_MESSAGES_MAP[ERROR_CODES.PROFILE_NOT_FOUND],
      ERROR_STATUS_MAP[ERROR_CODES.PROFILE_NOT_FOUND],
    );
  }

  // プロフィールデータバリデーション
  const profileData = ProfileResponseSchema.safeParse(profile);
  if (!profileData.success) {
    return createErrorResponse(
      ERROR_CODES.VALIDATION_ERROR,
      ERROR_MESSAGES_MAP[ERROR_CODES.VALIDATION_ERROR],
      ERROR_STATUS_MAP[ERROR_CODES.VALIDATION_ERROR],
    );
  }

  return createSuccessResponse(profileData.data);
}

export const getMyProfileService = async (
  authCtx: BaseAuthContext,
): Promise<ApiResponse<ProfileResponse>> => {
  const api = createApiClient(authCtx);
  const result = await fetchMyProfile(api);

  if (result.isErr()) {
    const { status, error } = result.error;
    return createErrorResponse(error, error, status);
  }

  return createSuccessResponse(result.value);
};
