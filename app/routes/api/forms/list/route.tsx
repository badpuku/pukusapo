// import { getAuth } from "@clerk/react-router/ssr.server";
import { data } from "react-router";
import { z } from "zod";

/* import {
  ERROR_CODES,
  ERROR_MESSAGES_MAP,
  ERROR_STATUS_MAP,
} from "~/constants/errors";
import { createServerSupabaseClient } from "~/services/supabase/client.server";
import { getProfileByUserId } from "~/services/supabase/profiles";
import { hasModeratorPermission } from "~/utils/permissions";

import type { Route } from "./+types/route"; */

export const FormsListSchema = z.object({
  success: z.boolean(),
  data: z.array(z.object({
    id: z.string(),
    title: z.string(),
    status: z.string(),
    created_at: z.string(),
    updated_at: z.string().nullable(),
  })),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }).nullable(),
});

export type FormsListResponse = z.infer<typeof FormsListSchema>;

const MOCK_DATA = [
  {
    id: "1",
    title: "フォーム1",
    status: "公開中",
    created_at: "2026-01-01 10:00:00",
    updated_at: "2026-01-02 12:00:00",
  },
  {
    id: "2",
    title: "フォーム2",
    status: "非公開",
    created_at: "2026-01-01 10:00:00",
    updated_at: "",
  },
];

export const action = async () => {
  return data(
    {
      success: true,
      data: MOCK_DATA,
      error: null,
    },
    { status: 200 },
  );
  // 認証チェック
  /* const auth = await getAuth(args);
  const userId = auth.userId;

  if (!userId) {
    return data(
      {
        success: false,
        data: null,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: ERROR_MESSAGES_MAP[ERROR_CODES.UNAUTHORIZED],
        },
      },
      { status: ERROR_STATUS_MAP[ERROR_CODES.UNAUTHORIZED] },
    );
  }

  // Supabase クライアント作成
  const supabase = createServerSupabaseClient(args);

  // プロフィール取得
  const profileResponse = await getProfileByUserId(supabase, userId);

  if (profileResponse.error || !profileResponse.data) {
    return data(
      {
        success: false,
        data: null,
        error: {
          code: ERROR_CODES.PROFILE_NOT_FOUND,
          message:
            profileResponse.error ||
            ERROR_MESSAGES_MAP[ERROR_CODES.PROFILE_NOT_FOUND],
        },
      },
      { status: ERROR_STATUS_MAP[ERROR_CODES.PROFILE_NOT_FOUND] },
    );
  }

  // 権限チェック（moderator 以上）
  const userProfile = profileResponse.data;
  const permissionLevel = userProfile.roles.permission_level;

  if (!hasModeratorPermission(permissionLevel)) {
    return data(
      {
        success: false,
        data: null,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: ERROR_MESSAGES_MAP[ERROR_CODES.FORBIDDEN],
        },
      },
      { status: ERROR_STATUS_MAP[ERROR_CODES.FORBIDDEN] },
    );
  }

  // フォーム一覧取得（created_at 降順）
  const { data: forms, error: fetchError } = await supabase
    .from("forms")
    .select("*")
    .order("created_at", { ascending: false });

  if (fetchError) {
    console.error("Forms list fetch error:", fetchError);
    return data(
      {
        success: false,
        data: null,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: ERROR_MESSAGES_MAP[ERROR_CODES.DATABASE_ERROR],
        },
      },
      { status: ERROR_STATUS_MAP[ERROR_CODES.DATABASE_ERROR] },
    );
  }

  return data(
    {
      success: true,
      data: forms,
      error: null,
    },
    { status: 200 },
  ); */
};
