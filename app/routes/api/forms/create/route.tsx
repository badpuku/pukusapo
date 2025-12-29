import { getAuth } from "@clerk/react-router/ssr.server";
import { parseWithZod } from "@conform-to/zod";
import { err, ok, Result } from "neverthrow";
import { data } from "react-router";

import {
  ERROR_CODES,
  ERROR_MESSAGES_MAP,
  ERROR_STATUS_MAP,
} from "~/constants/errors";
import { CreateFormSchema } from "~/models/forms";
import { createServerSupabaseClient } from "~/services/supabase/client.server";
import { getProfileByUserId } from "~/services/supabase/profiles";
import { hasModeratorPermission } from "~/utils/permissions";

import type { Route } from "./+types/route";

type UnauthorizedError = {
  code: typeof ERROR_CODES.UNAUTHORIZED;
  message: string;
};

export type FormCreateFetcherDataType = {
  data: {
    success: boolean;
    error: {
      code: string;
      message: string;
    } | null;
    data: {
      id: string;
      title: string;
      description: string | null;
      status: string;
      created_at: string;
      created_by: string;
    } | null;
  } | null;
};

const validateAuthResult = (
  userId: string | null,
): Result<string, UnauthorizedError> => {
  if (!userId) {
    return err({
      code: ERROR_CODES.UNAUTHORIZED,
      message: ERROR_MESSAGES_MAP[ERROR_CODES.UNAUTHORIZED],
    });
  }
  return ok(userId);
};

export const action = async (args: Route.ActionArgs) => {
  const { request } = args;
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: CreateFormSchema });

  const auth = await getAuth(args);
  const userId = auth.userId;

  // 認証チェック
  const authResult = validateAuthResult(userId);
  if (authResult.isErr()) {
    const error = authResult.error;
    return data(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      },
      { status: ERROR_STATUS_MAP[error.code] },
    );
  }

  const validatedUserId = authResult.value;

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
  const profileResponse = await getProfileByUserId(supabase, validatedUserId);

  if (profileResponse.error || !profileResponse.data) {
    return data(
      {
        success: false,
        error: {
          code: ERROR_CODES.PROFILE_NOT_FOUND,
          message: profileResponse.error || ERROR_MESSAGES_MAP[ERROR_CODES.PROFILE_NOT_FOUND],
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

  const { data: newForm, error: insertError } = await supabase
    .from("forms")
    .insert({
      title,
      description: description || null,
      status,
      created_by: userProfile.id,
    })
    .select()
    .single();

  if (insertError) {
    console.error("Form creation error:", insertError);
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
      data: newForm,
    },
    { status: 201 },
  );
};
