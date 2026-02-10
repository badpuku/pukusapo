import { getAuth } from "@clerk/react-router/ssr.server";
import type { LoaderFunctionArgs } from "react-router";

import {
  ERROR_CODES,
  ERROR_MESSAGES_MAP,
  ERROR_STATUS_MAP,
} from "~/constants/errors";
import { createErrorResponse, createSuccessResponse } from "~/lib/apiResponse";
import { deleteForm as deleteFormRepository } from "~/repositories/forms.server";
import { createServerSupabaseClient } from "~/services/supabase/client.server";

export async function deleteForm(args: LoaderFunctionArgs, formId: string) {
  const auth = await getAuth(args);
  const userId = auth.userId;

  if (!userId) {
    return createErrorResponse(
      ERROR_CODES.UNAUTHORIZED,
      ERROR_MESSAGES_MAP[ERROR_CODES.UNAUTHORIZED],
      ERROR_STATUS_MAP[ERROR_CODES.UNAUTHORIZED],
    );
  }

  const supabase = createServerSupabaseClient(args);
  const { data: deletedForm, error: deleteError } = await deleteFormRepository(
    supabase,
    formId,
  );

  if (deleteError) {
    return createErrorResponse(
      ERROR_CODES.DATABASE_ERROR,
      `[Supabase Error - deleteForm] ${deleteError.code}: ${deleteError.message}`,
      ERROR_STATUS_MAP[ERROR_CODES.DATABASE_ERROR],
    );
  }

  return createSuccessResponse(deletedForm);
}
