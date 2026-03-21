import { parseWithZod } from "@conform-to/zod";

import {
  ERROR_CODES,
  ERROR_MESSAGES_MAP,
  ERROR_STATUS_MAP,
} from "~/constants/errors";
import { createErrorResponse, createSuccessResponse } from "~/lib/apiResponse";
import { authenticate } from "~/lib/auth/context.server";
import { FormWithFieldsInputSchema } from "~/models/forms";
import { createForm } from "~/repositories/forms.server";
import { createFields } from "~/services/formFields/create.server";
import { getMyProfileService } from "~/services/profiles/get.server";
import { hasModeratorPermission } from "~/utils/permissions";

import type { Route } from "./+types/route";

export const action = async (args: Route.ActionArgs) => {
  const authCtx = await authenticate(args);

  // 認証チェック
  if (!authCtx) {
    return createErrorResponse(
      ERROR_CODES.UNAUTHORIZED,
      ERROR_MESSAGES_MAP[ERROR_CODES.UNAUTHORIZED],
      ERROR_STATUS_MAP[ERROR_CODES.UNAUTHORIZED],
    );
  }

  const formData = await args.request.formData();
  const submission = parseWithZod(formData, {
    schema: FormWithFieldsInputSchema,
  });

  // バリデーションエラーチェック
  if (submission.status !== "success") {
    return createErrorResponse(
      ERROR_CODES.VALIDATION_ERROR,
      ERROR_MESSAGES_MAP[ERROR_CODES.VALIDATION_ERROR],
      ERROR_STATUS_MAP[ERROR_CODES.VALIDATION_ERROR],
    );
  }

  const { title, description, status, fields } = submission.value;

  const supabase = authCtx.supabase;
  const profileResponse = await getMyProfileService(authCtx);

  if (!profileResponse.success) {
    return createErrorResponse(
      ERROR_CODES.PROFILE_NOT_FOUND,
      profileResponse.error.message,
      ERROR_STATUS_MAP[ERROR_CODES.PROFILE_NOT_FOUND],
    );
  }

  const userProfile = profileResponse.data;
  const permissionLevel = userProfile.role.permission_level;
  if (!hasModeratorPermission(permissionLevel)) {
    return createErrorResponse(
      ERROR_CODES.FORBIDDEN,
      ERROR_MESSAGES_MAP[ERROR_CODES.FORBIDDEN],
      ERROR_STATUS_MAP[ERROR_CODES.FORBIDDEN],
    );
  }

  const { data: newForm, error: insertError } = await createForm(supabase, {
    title,
    description: description || null,
    status,
    created_by: userProfile.id,
  });

  if (insertError) {
    return createErrorResponse(
      ERROR_CODES.DATABASE_ERROR,
      `[Supabase Error - createForm] ${insertError.code}: ${insertError.message}`,
      ERROR_STATUS_MAP[ERROR_CODES.DATABASE_ERROR],
    );
  }

  const { data: newFields, error: insertFieldsError } = await createFields(
    supabase,
    fields.map((field) => ({
      formId: newForm.id,
      ...field,
    })),
  );

  if (insertFieldsError) {
    return createErrorResponse(
      ERROR_CODES.DATABASE_ERROR,
      `[Supabase Error - createFields] ${insertFieldsError.code}: ${insertFieldsError.message}`,
      ERROR_STATUS_MAP[ERROR_CODES.DATABASE_ERROR],
    );
  }

  return createSuccessResponse({
    form: newForm,
    fields: newFields,
  }, 200);
};
