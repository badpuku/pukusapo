import { parseWithZod } from "@conform-to/zod";

import {
  ERROR_CODES,
  ERROR_MESSAGES_MAP,
  ERROR_STATUS_MAP,
} from "~/constants/errors";
import { createErrorResponse } from "~/lib/apiResponse";
import { FacilityAccountInputSchema } from "~/models/facilityAccounts";
import { createFacilityAccountService } from "~/services/facilityAccounts/create.server";

import type { Route } from "./+types/route";

export const action = async (args: Route.ActionArgs) => {
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

  return createFacilityAccountService(args, submission.value);
};
