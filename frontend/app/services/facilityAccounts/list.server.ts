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
import { findAllFacilityAccounts } from "~/repositories/facilityAccounts.server";
import {
  type FacilityAccountResponse,
  FacilityAccountResponseSchema,
} from "~/services/facilityAccounts/schemas";
import { getProfileByUserId } from "~/services/profiles/get.server";
import { createServerSupabaseClient } from "~/services/supabase/client.server";
import { hasModeratorPermission } from "~/utils/permissions";

/**
 * 施設アカウント一覧を取得する
 */
export async function getFacilityAccountsList(
  args: LoaderFunctionArgs,
  options: { offset?: number; limit?: number } = {},
): Promise<ApiResponse<FacilityAccountResponse[]>> {
  const { offset = 0, limit = 100 } = options;

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

  // 権限チェック
  const profileResponse = await getProfileByUserId(args, userId);
  if (!profileResponse.success) {
    return createErrorResponse(
      ERROR_CODES.PROFILE_NOT_FOUND,
      profileResponse.error.message,
      ERROR_STATUS_MAP[ERROR_CODES.PROFILE_NOT_FOUND],
    );
  }

  const userProfile = profileResponse.data;
  const permissionLevel = userProfile.roles.permission_level;

  if (!hasModeratorPermission(permissionLevel)) {
    return createErrorResponse(
      ERROR_CODES.FORBIDDEN,
      ERROR_MESSAGES_MAP[ERROR_CODES.FORBIDDEN],
      ERROR_STATUS_MAP[ERROR_CODES.FORBIDDEN],
    );
  }

  // 施設アカウントデータ取得
  const supabase = createServerSupabaseClient(args);
  const { data: accounts, error: accountsError } =
    await findAllFacilityAccounts(supabase, { offset, limit });

  // データ取得エラーチェック
  if (accountsError) {
    return createErrorResponse(
      ERROR_CODES.DATABASE_ERROR,
      `[Supabase Error] ${accountsError.code}: ${accountsError.message}`,
      ERROR_STATUS_MAP[ERROR_CODES.DATABASE_ERROR],
    );
  }

  // データバリデーション
  const result = FacilityAccountResponseSchema.array().safeParse(accounts);
  if (!result.success) {
    return createErrorResponse(
      ERROR_CODES.VALIDATION_ERROR,
      ERROR_MESSAGES_MAP[ERROR_CODES.VALIDATION_ERROR],
      ERROR_STATUS_MAP[ERROR_CODES.VALIDATION_ERROR],
    );
  }

  return createSuccessResponse(result.data);
}
