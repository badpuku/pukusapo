import { parseWithZod } from "@conform-to/zod";

import {
  ERROR_CODES,
  ERROR_MESSAGES_MAP,
  ERROR_STATUS_MAP,
} from "~/constants/errors";
import { createErrorResponse } from "~/lib/apiResponse";
import { FormWithFieldsInputSchema } from "~/models/forms";
import { updateFormWithFields } from "~/services/forms/update.server";

import type { Route } from "./+types/route";

export const action = async (args: Route.ActionArgs) => {
  const { params, request } = args;
  const formId = params.id;

  if (!formId) {
    return createErrorResponse(
      ERROR_CODES.RESOURCE_NOT_FOUND,
      "フォームIDが指定されていません",
      ERROR_STATUS_MAP[ERROR_CODES.RESOURCE_NOT_FOUND],
    );
  }

  const formData = await request.formData();
  const submission = parseWithZod(formData, {
    schema: FormWithFieldsInputSchema,
  });

  if (submission.status !== "success") {
    return createErrorResponse(
      ERROR_CODES.VALIDATION_ERROR,
      ERROR_MESSAGES_MAP[ERROR_CODES.VALIDATION_ERROR],
      ERROR_STATUS_MAP[ERROR_CODES.VALIDATION_ERROR],
    );
  }

  return updateFormWithFields(args, formId, submission.value);
};
