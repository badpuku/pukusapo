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
import type { ApiKeyAuthContext, AuthContext } from "~/lib/auth/types";
import type { FacilityAccountInput } from "~/models/facilityAccounts";
import { createFacilityAccount } from "~/repositories/facilityAccounts.server";
import { findAdminProfileForSecretKey } from "~/repositories/profiles.server";
import { encryptPassword } from "~/services/facilityAccounts/encryption.server";
import { hasModeratorPermission } from "~/utils/permissions";


/**
 * Supabase Secret Key の場合の仮のプロフィール id を取得する
 */
export async function getProfileIdForSecretKey(
  authCtx: ApiKeyAuthContext,
): Promise<string | null> {
  const supabase = authCtx.supabase;
  const { data: profile, error: profileError } = await findAdminProfileForSecretKey(
    supabase,
  );
  if (profileError) {
    return null;
  }
  return profile.id;
}

/**
 * 施設アカウントを作成する
 */
export async function createFacilityAccountService(
  authCtx: AuthContext | ApiKeyAuthContext,
  input: FacilityAccountInput,
): Promise<ApiResponse<{ id: string }>> {
  const isClerkAuth = "profile" in authCtx;
  // 権限チェック
  if (isClerkAuth) {
    const permissionLevel = authCtx.profile.roles.permission_level;
    if (!hasModeratorPermission(permissionLevel)) {
      return createErrorResponse(
        ERROR_CODES.FORBIDDEN,
        ERROR_MESSAGES_MAP[ERROR_CODES.FORBIDDEN],
        ERROR_STATUS_MAP[ERROR_CODES.FORBIDDEN],
      );
    }
  }

  // パスワード暗号化
  const encryptionKey = authCtx.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    return createErrorResponse(
      ERROR_CODES.DATABASE_ERROR,
      "暗号化キーが設定されていません",
      ERROR_STATUS_MAP[ERROR_CODES.DATABASE_ERROR],
    );
  }

  const encryptedPassword = await encryptPassword(input.password, encryptionKey);

  const supabase = authCtx.supabase;

  /**
   * 管理画面からの操作の場合は、自分のプロフィール id を取得する
   * API Key 経由の操作の場合は、SUPABASE_管理者 のプロフィール id を取得する
   */
  const profileId = isClerkAuth ? authCtx.profile.id : await getProfileIdForSecretKey(authCtx);
  if (!profileId) {
    return createErrorResponse(
      ERROR_CODES.DATABASE_ERROR,
      "プロフィールが見つかりません",
      ERROR_STATUS_MAP[ERROR_CODES.DATABASE_ERROR],
    );
  }

  // 施設アカウント作成
  const { data: newAccount, error: insertError } = await createFacilityAccount(
    supabase,
    {
      profile_id: profileId,
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
