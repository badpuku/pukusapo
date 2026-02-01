import { getAuth } from "@clerk/react-router/ssr.server";
import type { LoaderFunctionArgs } from "react-router";

import {
  ERROR_CODES,
  ERROR_MESSAGES_MAP,
  ERROR_STATUS_MAP,
} from "~/constants/errors";
import { createErrorResponse, createSuccessResponse } from "~/lib/apiResponse";
import { deleteFacilityAccount as deleteFacilityAccountRepository } from "~/repositories/facilityAccounts.server";
import { getProfileByUserId } from "~/services/profiles/get.server";
import { createServerSupabaseClient } from "~/services/supabase/client.server";
import { hasModeratorPermission } from "~/utils/permissions";

/**
 * 施設アカウントを削除する
 */
export async function deleteFacilityAccount(
  args: LoaderFunctionArgs,
  accountId: string,
) {
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

  // 施設アカウント削除
  const supabase = createServerSupabaseClient(args);
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

  return createSuccessResponse(null);
}
