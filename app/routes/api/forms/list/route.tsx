import { getAuth } from "@clerk/react-router/ssr.server";
import { data } from "react-router";
import { z } from "zod";

import {
  ERROR_CODES,
  ERROR_MESSAGES_MAP,
  ERROR_STATUS_MAP,
} from "~/constants/errors";
import { FormResponseSchema } from "~/services/forms/schemas";
import { createServerSupabaseClient } from "~/services/supabase/client.server";
import { getProfileByUserId } from "~/services/supabase/profiles";
import { hasModeratorPermission } from "~/utils/permissions";

import type { Route } from "./+types/route";

const paramsSchema = z.object({
  offset: z.number().default(0),
});

export const action = async (args: Route.ActionArgs) => {
  // 認証チェック
  const auth = await getAuth(args);
  const userId = auth.userId;

  if (!userId) {
    return data(
      {
        success: false,
        data: null,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: "",
        },
      },
      { status: ERROR_STATUS_MAP[ERROR_CODES.UNAUTHORIZED] },
    );
  }

  const params = await args.params;
  const validatedParams = paramsSchema.safeParse(params);
  if (!validatedParams.success) {
    return data(
      {
        success: false,
        data: null,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: ERROR_MESSAGES_MAP[ERROR_CODES.VALIDATION_ERROR],
        },
      },
      { status: ERROR_STATUS_MAP[ERROR_CODES.VALIDATION_ERROR] },
    );
  }

  const { offset } = validatedParams.data;

  const supabase = createServerSupabaseClient(args);
  const profileResponse = await getProfileByUserId(supabase, userId);

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

  const { data: forms, error: formsError } = await supabase
    .from("forms")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10)
    .range(offset, offset + 9);

  if (formsError) {
    return data(
      {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message:
            formsError.message ||
            ERROR_MESSAGES_MAP[ERROR_CODES.DATABASE_ERROR],
        },
      },
      { status: ERROR_STATUS_MAP[ERROR_CODES.DATABASE_ERROR] },
    );
  }

  const formsData = forms.map((form) => FormResponseSchema.safeParse(form));
  if (formsData.some((result) => !result.success)) {
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

  return data(
    { success: true, data: formsData.map((result) => result.data) },
    { status: 200 },
  );
};
