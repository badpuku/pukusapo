import {
  ERROR_CODES,
  ERROR_MESSAGES_MAP,
  ERROR_STATUS_MAP,
} from "~/constants/errors";
import { type ApiResponse, createErrorResponse, createSuccessResponse } from "~/lib/apiResponse";
import { authenticateWithProfile } from "~/lib/auth/context.server";
import { deleteFacilityAccountService } from "~/services/facilityAccounts/delete.server";

import type { Route } from "./+types/route";

export const handleDelete = async (args: Route.ActionArgs): Promise<ApiResponse<{ id: string }>> => {
  const { params } = args;
  const accountId = params.id;

  const authCtx = await authenticateWithProfile(args);
  if (!authCtx) {
    return createErrorResponse(
      ERROR_CODES.UNAUTHORIZED,
      ERROR_MESSAGES_MAP[ERROR_CODES.UNAUTHORIZED],
      ERROR_STATUS_MAP[ERROR_CODES.UNAUTHORIZED],
    );
  }

  const response = await deleteFacilityAccountService(authCtx, accountId);
  if (!response.success) {
    return createErrorResponse(
      response.error.code,
      response.error.message,
      response.status,
    );
  }
  return createSuccessResponse(response.data, response.status);
};