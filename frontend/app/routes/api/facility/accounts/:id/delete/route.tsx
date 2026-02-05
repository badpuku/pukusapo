import {
  ERROR_CODES,
  ERROR_STATUS_MAP,
} from "~/constants/errors";
import { createErrorResponse } from "~/lib/apiResponse";
import { deleteFacilityAccount } from "~/services/facilityAccounts/delete.server";

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

  return deleteFacilityAccount(args, accountId);
};
