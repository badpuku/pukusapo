import {
  ERROR_CODES,
  ERROR_MESSAGES_MAP,
  ERROR_STATUS_MAP,
} from "~/constants/errors";
import { type ApiResponse, createErrorResponse, createSuccessResponse } from "~/lib/apiResponse";
import type { AuthContext } from "~/lib/auth/types";
import { deleteFacilityAccount as deleteFacilityAccountRepository } from "~/repositories/facilityAccounts.server";
import { hasModeratorPermission } from "~/utils/permissions";

/**
 * 施設アカウントを削除する
 */
export async function deleteFacilityAccountService(
  authCtx: AuthContext,
  accountId: string,
): Promise<ApiResponse<{ id: string }>> {
  // 権限チェック
  const permissionLevel = authCtx.profile.roles.permission_level;
  if (!hasModeratorPermission(permissionLevel)) {
    return createErrorResponse(
      ERROR_CODES.FORBIDDEN,
      ERROR_MESSAGES_MAP[ERROR_CODES.FORBIDDEN],
      ERROR_STATUS_MAP[ERROR_CODES.FORBIDDEN],
    );
  }

  // 施設アカウント削除
  const supabase = authCtx.supabase;
  const { error: deleteError } = await deleteFacilityAccountRepository(
    supabase,
    accountId,
  );

  if (deleteError) {
    return createErrorResponse(
      ERROR_CODES.DATABASE_ERROR,
      `[Supabase Error - deleteFacilityAccount] ${deleteError.code}: ${deleteError.message}`,
      ERROR_STATUS_MAP[ERROR_CODES.DATABASE_ERROR],
    );
  }

  return createSuccessResponse({ id: accountId }, 200);
}
