import {
  ERROR_CODES,
  ERROR_MESSAGES_MAP,
  ERROR_STATUS_MAP,
} from "~/constants/errors";
import { createErrorResponse, createSuccessResponse } from "~/lib/apiResponse";
import { authenticateWithClerkAndApiKey } from "~/lib/auth/context.server";
import { getFacilityCollectionJobService } from "~/services/facilityCollectionJobs/get.server";

import type { Route } from "./+types/route";

export const loader = async (args: Route.LoaderArgs) => {
  const authCtx = await authenticateWithClerkAndApiKey(args);
  if (!authCtx) {
    return createErrorResponse(
      ERROR_CODES.UNAUTHORIZED,
      ERROR_MESSAGES_MAP[ERROR_CODES.UNAUTHORIZED],
      ERROR_STATUS_MAP[ERROR_CODES.UNAUTHORIZED],
    );
  }
  const response = await getFacilityCollectionJobService(authCtx);
  if (!response.success) {
    return createErrorResponse(
      response.error.code,
      response.error.message,
      response.status,
    );
  }
  return createSuccessResponse(response.data, response.status);
};