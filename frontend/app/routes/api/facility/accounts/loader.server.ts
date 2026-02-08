import {
  ERROR_CODES,
  ERROR_MESSAGES_MAP,
  ERROR_STATUS_MAP,
} from "~/constants/errors";
import { createErrorResponse, createSuccessResponse } from "~/lib/apiResponse";
import { authenticateWithClerkAndApiKey } from "~/lib/auth/context.server";
import { getFacilityAccountsService } from "~/services/facilityAccounts/get.server";

import type { Route } from "./+types/route";

export const loader = async (args: Route.LoaderArgs) => {
  const query = new URL(args.request.url).searchParams;
  const offset = query.get("offset") ? parseInt(query.get("offset")!) : 0;
  const limit = query.get("limit") ? parseInt(query.get("limit")!) : 100;
  const options = { offset, limit };

  const authCtx = await authenticateWithClerkAndApiKey(args);
  if (!authCtx) {
    return createErrorResponse(
      ERROR_CODES.UNAUTHORIZED,
      ERROR_MESSAGES_MAP[ERROR_CODES.UNAUTHORIZED],
      ERROR_STATUS_MAP[ERROR_CODES.UNAUTHORIZED],
    );
  }
  const response = await getFacilityAccountsService(authCtx, undefined, options);
  if (!response.success) {
    return createErrorResponse(
      response.error.code,
      response.error.message,
      response.status,
    );
  }
  return createSuccessResponse(response.data, response.status);
};