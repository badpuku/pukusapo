import { getAuth } from "@clerk/react-router/ssr.server";
import type { LoaderFunctionArgs } from "react-router";

import {
  ERROR_CODES,
  ERROR_MESSAGES_MAP,
  ERROR_STATUS_MAP,
} from "~/constants/errors";
import {
  FormResponseSchema,
  type FormsListResponse,
} from "~/services/forms/schemas";
import { createServerSupabaseClient } from "~/services/supabase/client.server";
import { getProfileByUserId } from "~/services/supabase/profiles";
import { hasModeratorPermission } from "~/utils/permissions";

/**
 * フォーム一覧を取得するサービス関数
 *
 * 認証済みユーザーのフォーム一覧を取得します。
 * moderator以上の権限が必要です。
 */
export async function getFormsList(
  args: LoaderFunctionArgs,
  options: { offset?: number; limit?: number } = {},
): Promise<FormsListResponse> {
  const { offset = 0, limit = 10 } = options;

  // 認証チェック
  const auth = await getAuth(args);
  const userId = auth.userId;

  if (!userId) {
    return {
      success: false,
      data: null,
      error: {
        code: ERROR_CODES.UNAUTHORIZED,
        message: ERROR_MESSAGES_MAP[ERROR_CODES.UNAUTHORIZED],
      },
      status: ERROR_STATUS_MAP[ERROR_CODES.UNAUTHORIZED],
    };
  }

  // Supabaseクライアント作成
  const supabase = createServerSupabaseClient(args);

  // プロフィール取得
  const profileResponse = await getProfileByUserId(supabase, userId);

  if (profileResponse.error || !profileResponse.data) {
    return {
      success: false,
      data: null,
      error: {
        code: ERROR_CODES.PROFILE_NOT_FOUND,
        message:
          profileResponse.error ||
          ERROR_MESSAGES_MAP[ERROR_CODES.PROFILE_NOT_FOUND],
      },
      status: ERROR_STATUS_MAP[ERROR_CODES.PROFILE_NOT_FOUND],
    };
  }

  // 権限チェック
  const userProfile = profileResponse.data;
  const permissionLevel = userProfile.roles.permission_level;

  if (!hasModeratorPermission(permissionLevel)) {
    return {
      success: false,
      data: null,
      error: {
        code: ERROR_CODES.FORBIDDEN,
        message: ERROR_MESSAGES_MAP[ERROR_CODES.FORBIDDEN],
      },
      status: ERROR_STATUS_MAP[ERROR_CODES.FORBIDDEN],
    };
  }

  // フォームデータ取得
  const { data: forms, error: formsError } = await supabase
    .from("forms")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)
    .range(offset, offset + limit - 1);

  if (formsError) {
    return {
      success: false,
      data: null,
      error: {
        code: ERROR_CODES.DATABASE_ERROR,
        message:
          formsError.message || ERROR_MESSAGES_MAP[ERROR_CODES.DATABASE_ERROR],
      },
      status: ERROR_STATUS_MAP[ERROR_CODES.DATABASE_ERROR],
    };
  }

  // バリデーション
  const formsData = forms.map((form) => FormResponseSchema.safeParse(form));

  if (formsData.some((result) => !result.success)) {
    return {
      success: false,
      data: null,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: ERROR_MESSAGES_MAP[ERROR_CODES.VALIDATION_ERROR],
      },
      status: ERROR_STATUS_MAP[ERROR_CODES.VALIDATION_ERROR],
    };
  }

  return {
    success: true,
    data: formsData.map((result) => result.data!),
    status: 200,
  };
}
