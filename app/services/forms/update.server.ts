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
import type { FormWithFieldsInput } from "~/models/forms";
import { updateForm } from "~/repositories/forms.server";
import { syncFormFields } from "~/services/formFields/sync.server";
import { getProfileByUserId } from "~/services/profiles/get.server";
import { createServerSupabaseClient } from "~/services/supabase/client.server";
import { hasModeratorPermission } from "~/utils/permissions";

/**
 * フォームと項目を更新する
 *
 * @param args - LoaderFunctionArgs
 * @param formId - 更新対象のフォームID
 * @param input - 更新データ
 * @returns 更新されたフォームと項目
 */
export async function updateFormWithFields(
  args: LoaderFunctionArgs,
  formId: string,
  input: FormWithFieldsInput,
): Promise<ApiResponse<{ form: unknown; fields: unknown[] }>> {
  const auth = await getAuth(args);
  const userId = auth.userId;

  if (!userId) {
    return createErrorResponse(
      ERROR_CODES.UNAUTHORIZED,
      ERROR_MESSAGES_MAP[ERROR_CODES.UNAUTHORIZED],
      ERROR_STATUS_MAP[ERROR_CODES.UNAUTHORIZED],
    );
  }

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

  const supabase = createServerSupabaseClient(args);
  const { data: updatedForm, error: updateError } = await updateForm(
    supabase,
    formId,
    {
      title: input.title,
      description: input.description || null,
      status: input.status,
      updated_at: new Date().toISOString(),
    },
  );

  if (updateError) {
    return createErrorResponse(
      ERROR_CODES.DATABASE_ERROR,
      `[Supabase Error - updateForm] ${updateError.code}: ${updateError.message}`,
      ERROR_STATUS_MAP[ERROR_CODES.DATABASE_ERROR],
    );
  }

  const fieldsResponse = await syncFormFields(supabase, formId, input.fields);

  if (!fieldsResponse.success) {
    return fieldsResponse;
  }

  return createSuccessResponse(
    {
      form: updatedForm,
      fields: fieldsResponse.data,
    },
    200,
  );
}
