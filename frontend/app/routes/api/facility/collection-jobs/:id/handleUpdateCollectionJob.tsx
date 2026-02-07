import { parseWithZod } from "@conform-to/zod";
import type { ActionFunctionArgs } from "react-router";

import {
  ERROR_CODES,
  ERROR_MESSAGES_MAP,
  ERROR_STATUS_MAP,
} from "~/constants/errors";
import { type ApiResponse, createErrorResponse, createSuccessResponse } from "~/lib/apiResponse";
import { authenticateWithClerkAndApiKey } from "~/lib/auth/context.server";
import { FacilityCollectionJobUpdateInputSchema } from "~/models/facilityCollectionJob";
import { updateFacilityCollectionJobService } from "~/services/facilityCollectionJobs/update.server";

export const handleUpdateCollectionJob = async (args: ActionFunctionArgs): Promise<ApiResponse<{ id: number }>> => {
  const { params, request } = args;
  const jobId = params.id;
  const formData = await request.formData();
  const submission = parseWithZod(formData, {
    schema: FacilityCollectionJobUpdateInputSchema,
  });
  if (submission.status !== "success") {
    return createErrorResponse(
      ERROR_CODES.VALIDATION_ERROR,
      ERROR_MESSAGES_MAP[ERROR_CODES.VALIDATION_ERROR],
      ERROR_STATUS_MAP[ERROR_CODES.VALIDATION_ERROR],
    );
  }

  const authCtx = await authenticateWithClerkAndApiKey(args);
  if (!authCtx) {
    return createErrorResponse(
      ERROR_CODES.UNAUTHORIZED,
      ERROR_MESSAGES_MAP[ERROR_CODES.UNAUTHORIZED],
      ERROR_STATUS_MAP[ERROR_CODES.UNAUTHORIZED],
    );
  }

  const response = await updateFacilityCollectionJobService(authCtx, Number(jobId), submission.value);
  if (!response.success) {
    return createErrorResponse(
      response.error.code,
      response.error.message,
      response.status,
    );
  }
  return createSuccessResponse(response.data, response.status);
};