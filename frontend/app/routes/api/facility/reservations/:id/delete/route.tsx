import {
  ERROR_CODES,
  ERROR_MESSAGES_MAP,
  ERROR_STATUS_MAP,
} from "~/constants/errors";
import { createErrorResponse } from "~/lib/apiResponse";
import { authenticateWithProfile } from "~/lib/auth/context.server";
import { deleteFacilityAccountService } from "~/services/facilityAccounts/delete.server";

import type { Route } from "./+types/route";

export const action = async (args: Route.ActionArgs) => {
  const { params } = args;
  const accountId = params.id;

  if (!accountId) {
    return createErrorResponse(
      ERROR_CODES.RESOURCE_NOT_FOUND,
      "アカウントIDが指定されていません",
      ERROR_STATUS_MAP[ERROR_CODES.RESOURCE_NOT_FOUND],
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
  return deleteFacilityAccountService(authCtx, accountId);
};
