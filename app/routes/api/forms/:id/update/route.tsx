import { getAuth } from "@clerk/react-router/ssr.server";
import { parseWithZod } from "@conform-to/zod";
import { data } from "react-router";

import {
  ERROR_CODES,
  ERROR_MESSAGES_MAP,
  ERROR_STATUS_MAP,
} from "~/constants/errors";
import { FormInputSchema } from "~/models/forms";
import { getProfileByUserId } from "~/services/profiles/get.server";
import { createServerSupabaseClient } from "~/services/supabase/client.server";
import { hasModeratorPermission } from "~/utils/permissions";

import type { Route } from "./+types/route";

export const action = async (args: Route.ActionArgs) => {
  const { request, params } = args;
  const formId = params.id;

  if (!formId) {
    return data(
      {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: "フォームIDが指定されていません",
        },
      },
      { status: 400 },
    );
  }

  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: FormInputSchema });

  const auth = await getAuth(args);
  const userId = auth.userId;

  // 認証チェック
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

  // バリデーションエラーチェック
  if (submission.status !== "success") {
    return data(
      {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: ERROR_MESSAGES_MAP[ERROR_CODES.VALIDATION_ERROR],
        },
      },
      { status: ERROR_STATUS_MAP[ERROR_CODES.VALIDATION_ERROR] },
    );
  }

  const { title, description, status } = submission.value;

  const supabase = createServerSupabaseClient(args);
  const profileResponse = await getProfileByUserId(args, userId);

  if (profileResponse.error || !profileResponse.data) {
    return data(
      {
        success: false,
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

  const userProfile = profileResponse.data;
  const permissionLevel = userProfile.roles.permission_level;

  if (!hasModeratorPermission(permissionLevel)) {
    return data(
      {
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: ERROR_MESSAGES_MAP[ERROR_CODES.FORBIDDEN],
        },
      },
      { status: ERROR_STATUS_MAP[ERROR_CODES.FORBIDDEN] },
    );
  }

  // フォームの存在確認と更新
  const { data: updatedForm, error: updateError } = await supabase
    .from("forms")
    .update({
      title,
      description: description || null,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", formId)
    .select()
    .single();

  if (updateError) {
    // フォームが見つからない場合
    if (updateError.code === "PGRST116") {
      return data(
        {
          success: false,
          error: {
            code: ERROR_CODES.RESOURCE_NOT_FOUND,
            message: "フォームが見つかりません",
          },
        },
        { status: ERROR_STATUS_MAP[ERROR_CODES.RESOURCE_NOT_FOUND] },
      );
    }

    console.error("Form update error:", updateError);
    return data(
      {
        success: false,
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
      data: updatedForm,
    },
    { status: 200 },
  );
};
