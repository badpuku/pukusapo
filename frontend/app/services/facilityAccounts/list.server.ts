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
import { authenticate } from "~/lib/auth/context.server";
import { findAllFacilityAccounts } from "~/repositories/facilityAccounts.server";
import {
  type FacilityAccountResponse,
  FacilityAccountResponseSchema,
} from "~/services/facilityAccounts/schemas";
import { getMyProfileService } from "~/services/profiles/get.server";
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
  const authCtx = await authenticate(args);
  if (!authCtx) {
    return createErrorResponse(
      ERROR_CODES.UNAUTHORIZED,
      ERROR_MESSAGES_MAP[ERROR_CODES.UNAUTHORIZED],
      ERROR_STATUS_MAP[ERROR_CODES.UNAUTHORIZED],
    );
  }

  // 権限チェック
  const profileResponse = await getMyProfileService(authCtx);
  if (!profileResponse.success) {
    return createErrorResponse(
      ERROR_CODES.PROFILE_NOT_FOUND,
      profileResponse.error.message,
      ERROR_STATUS_MAP[ERROR_CODES.PROFILE_NOT_FOUND],
    );
  }

  const userProfile = profileResponse.data;
  const permissionLevel = userProfile.role.permission_level;

  if (!hasModeratorPermission(permissionLevel)) {
    return createErrorResponse(
      ERROR_CODES.FORBIDDEN,
      ERROR_MESSAGES_MAP[ERROR_CODES.FORBIDDEN],
      ERROR_STATUS_MAP[ERROR_CODES.FORBIDDEN],
    );
  }

  // 施設アカウントデータ取得
  const supabase = authCtx.supabase;
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
