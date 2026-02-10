import { parseWithZod } from "@conform-to/zod";

import {
  ERROR_CODES,
  ERROR_MESSAGES_MAP,
  ERROR_STATUS_MAP,
} from "~/constants/errors";
import { createErrorResponse, createSuccessResponse } from "~/lib/apiResponse";
import { authenticateWithClerkAndApiKey } from "~/lib/auth/context.server";
import { FacilityAccountInputSchema } from "~/models/facilityAccounts";
import { loader as accountsLoader } from "~/routes/api/facility/accounts/loader.server";
import { createFacilityAccountService } from "~/services/facilityAccounts/create.server";

import type { Route } from "./+types/route";

export const loader = accountsLoader;

export const action = async (args: Route.ActionArgs) => {
  const authCtx = await authenticateWithClerkAndApiKey(args);
  if (!authCtx) {
    return createErrorResponse(
      ERROR_CODES.UNAUTHORIZED,
      ERROR_MESSAGES_MAP[ERROR_CODES.UNAUTHORIZED],
      ERROR_STATUS_MAP[ERROR_CODES.UNAUTHORIZED],
    );
  }

  const formData = await args.request.formData();
  const submission = parseWithZod(formData, {
    schema: FacilityAccountInputSchema,
  });

  // バリデーションエラーチェック
  if (submission.status !== "success") {
    return createErrorResponse(
      ERROR_CODES.VALIDATION_ERROR,
      ERROR_MESSAGES_MAP[ERROR_CODES.VALIDATION_ERROR],
      ERROR_STATUS_MAP[ERROR_CODES.VALIDATION_ERROR],
    );
  }

  const response = await createFacilityAccountService(authCtx, submission.value);
  if (!response.success) {
    return createErrorResponse(
      response.error.code,
      response.error.message,
      response.status,
    );
  }
  return createSuccessResponse(response.data, response.status);
};
