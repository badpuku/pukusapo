import {
  ERROR_CODES,
  ERROR_MESSAGES_MAP,
  ERROR_STATUS_MAP,
} from "~/constants/errors";
import { createErrorResponse } from "~/lib/apiResponse";
import { handleUpdateCollectionJob } from "~/routes/api/facility/collection-jobs/:id/handleUpdateCollectionJob";

import type { Route } from "./+types/route";

export const action = async (args: Route.ActionArgs) => {
  const { params, request } = args;
  const jobId = params.id;
  const method = request.method;

  if (!jobId) {
    return createErrorResponse(
      ERROR_CODES.RESOURCE_NOT_FOUND,
      "収集ジョブIDが指定されていません",
      ERROR_STATUS_MAP[ERROR_CODES.RESOURCE_NOT_FOUND],
    );
  }

  if (method === "PUT") {
    return handleUpdateCollectionJob(request);
  }

  return createErrorResponse(
    ERROR_CODES.METHOD_NOT_ALLOWED,
    ERROR_MESSAGES_MAP[ERROR_CODES.METHOD_NOT_ALLOWED],
    ERROR_STATUS_MAP[ERROR_CODES.METHOD_NOT_ALLOWED],
  );
};
