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
import type { FacilityAccountUpdateInput } from "~/models/facilityAccounts";
import { updateFacilityAccount } from "~/repositories/facilityAccounts.server";
import { encryptPassword } from "~/services/facilityAccounts/encryption.server";
import { getProfileByUserId } from "~/services/profiles/get.server";
import { createServerSupabaseClient } from "~/services/supabase/client.server";
import { hasModeratorPermission } from "~/utils/permissions";

/**
 * 施設アカウントを更新する
 */
export async function updateFacilityAccountService(
  args: LoaderFunctionArgs,
  accountId: string,
  input: FacilityAccountUpdateInput,
): Promise<ApiResponse<{ id: string }>> {
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

  // 更新データを構築
  const updateData: {
    user_id: string;
    encrypted_password?: string;
    circle_name: string | null;
    representative_name: string | null;
    updated_at: string;
  } = {
    user_id: input.userId,
    circle_name: input.circleName || null,
    representative_name: input.representativeName || null,
    updated_at: new Date().toISOString(),
  };

  // パスワードが入力された場合のみ暗号化して更新
  if (input.password && input.password.length > 0) {
    const encryptionKey = args.context.cloudflare.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      return createErrorResponse(
        ERROR_CODES.DATABASE_ERROR,
        "暗号化キーが設定されていません",
        ERROR_STATUS_MAP[ERROR_CODES.DATABASE_ERROR],
      );
    }
    updateData.encrypted_password = await encryptPassword(
      input.password,
      encryptionKey,
    );
  }

  // 施設アカウント更新
  const supabase = createServerSupabaseClient(args);
  const { data: updatedAccount, error: updateError } =
    await updateFacilityAccount(supabase, accountId, updateData);

  if (updateError) {
    return createErrorResponse(
      ERROR_CODES.DATABASE_ERROR,
      `[Supabase Error - updateFacilityAccount] ${updateError.code}: ${updateError.message}`,
      ERROR_STATUS_MAP[ERROR_CODES.DATABASE_ERROR],
    );
  }

  return createSuccessResponse({ id: updatedAccount.id }, 200);
}
