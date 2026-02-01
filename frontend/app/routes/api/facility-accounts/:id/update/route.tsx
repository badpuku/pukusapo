import { parseWithZod } from "@conform-to/zod";

import {
  ERROR_CODES,
  ERROR_MESSAGES_MAP,
  ERROR_STATUS_MAP,
} from "~/constants/errors";
import { createErrorResponse } from "~/lib/apiResponse";
import { FacilityAccountUpdateInputSchema } from "~/models/facilityAccounts";
import { updateFacilityAccountService } from "~/services/facilityAccounts/update.server";

import type { Route } from "./+types/route";

export const action = async (args: Route.ActionArgs) => {
  const { params, request } = args;
  const accountId = params.id;

  if (!accountId) {
    return createErrorResponse(
      ERROR_CODES.RESOURCE_NOT_FOUND,
      "アカウントIDが指定されていません",
      ERROR_STATUS_MAP[ERROR_CODES.RESOURCE_NOT_FOUND],
    );
  }

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

  return updateFacilityAccountService(args, accountId, submission.value);
};
