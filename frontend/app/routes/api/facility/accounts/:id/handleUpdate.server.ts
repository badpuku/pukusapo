import { parseWithZod } from "@conform-to/zod";

import {
  ERROR_CODES,
  ERROR_MESSAGES_MAP,
  ERROR_STATUS_MAP,
} from "~/constants/errors";
import { type ApiResponse, createErrorResponse, createSuccessResponse } from "~/lib/apiResponse";
import { authenticateWithProfile } from "~/lib/auth/context.server";
import { FacilityAccountUpdateInputSchema } from "~/models/facilityAccounts";
import { updateFacilityAccountService } from "~/services/facilityAccounts/update.server";

import type { Route } from "./+types/route";

export const handleUpdateFacilityAccount = async (args: Route.ActionArgs): Promise<ApiResponse<{ id: string }>> => {
  const { params, request } = args;
  const accountId = params.id;
  const formData = await request.formData();
  const submission = parseWithZod(formData, {
    schema: FacilityAccountUpdateInputSchema,
  });
  if (submission.status !== "success") {
    return createErrorResponse(
      ERROR_CODES.VALIDATION_ERROR,
      ERROR_MESSAGES_MAP[ERROR_CODES.VALIDATION_ERROR],
      ERROR_STATUS_MAP[ERROR_CODES.VALIDATION_ERROR],
    );
  }

  const authCtx = await authenticateWithProfile(args);
  if (!authCtx) {
    return createErrorResponse(
      ERROR_CODES.UNAUTHORIZED,
      ERROR_MESSAGES_MAP[ERROR_CODES.UNAUTHORIZED],
      ERROR_STATUS_MAP[ERROR_CODES.UNAUTHORIZED],
    );
  }

  const response = await updateFacilityAccountService(authCtx, accountId, submission.value);
  if (!response.success) {
    return createErrorResponse(
      response.error.code,
      response.error.message,
      response.status,
    );
  }
  return createSuccessResponse(response.data, response.status);
};