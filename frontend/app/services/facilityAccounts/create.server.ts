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
import type { FacilityAccountInput } from "~/models/facilityAccounts";
import { createFacilityAccount } from "~/repositories/facilityAccounts.server";
import { encryptPassword } from "~/services/facilityAccounts/encryption.server";
import { getProfileByUserId } from "~/services/profiles/get.server";
import { createServerSupabaseClient } from "~/services/supabase/client.server";
import { hasModeratorPermission } from "~/utils/permissions";

/**
 * 施設アカウントを作成する
 */
export async function createFacilityAccountService(
  args: LoaderFunctionArgs,
  input: FacilityAccountInput,
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

  // パスワード暗号化
  const encryptionKey = args.context.cloudflare.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    return createErrorResponse(
      ERROR_CODES.DATABASE_ERROR,
      "暗号化キーが設定されていません",
      ERROR_STATUS_MAP[ERROR_CODES.DATABASE_ERROR],
    );
  }

  const encryptedPassword = await encryptPassword(input.password, encryptionKey);

  // 施設アカウント作成
  const supabase = createServerSupabaseClient(args);
  const { data: newAccount, error: insertError } = await createFacilityAccount(
    supabase,
    {
      profile_id: userProfile.id,
      user_id: input.userId,
      encrypted_password: encryptedPassword,
      circle_name: input.circleName || null,
      representative_name: input.representativeName || null,
    },
  );

  if (insertError) {
    return createErrorResponse(
      ERROR_CODES.DATABASE_ERROR,
      `[Supabase Error - createFacilityAccount] ${insertError.code}: ${insertError.message}`,
      ERROR_STATUS_MAP[ERROR_CODES.DATABASE_ERROR],
    );
  }

  return createSuccessResponse({ id: newAccount.id }, 201);
}
