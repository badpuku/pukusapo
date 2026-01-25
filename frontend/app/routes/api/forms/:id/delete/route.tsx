import {
  ERROR_CODES,
  ERROR_STATUS_MAP,
} from "~/constants/errors";
import { createErrorResponse } from "~/lib/apiResponse";
import { deleteForm } from "~/services/forms/delete.server";

import type { Route } from "./+types/route";

export const action = async (args: Route.ActionArgs) => {
  const { params } = args;
  const formId = params.id;

  if (!formId) {
    return createErrorResponse(
      ERROR_CODES.RESOURCE_NOT_FOUND,
      "フォームIDが指定されていません",
      ERROR_STATUS_MAP[ERROR_CODES.RESOURCE_NOT_FOUND],
    );
  }

  return deleteForm(args, formId);
};
