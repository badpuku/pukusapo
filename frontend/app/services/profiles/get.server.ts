import { fetchMyProfile } from "~/api/profiles.server";
import {
  ERROR_CODES,
  ERROR_MESSAGES_MAP,
  ERROR_STATUS_MAP,
} from "~/constants/errors";
import { createApiClient } from "~/lib/apiClient.server";
import {
  type ApiResponse,
  createErrorResponse,
  createSuccessResponse,
} from "~/lib/apiResponse";
import type { BaseAuthContext } from "~/lib/auth/types";
import { type ProfileResponse } from "~/services/profiles/schemas";

export const getMyProfileService = async (
  authCtx: BaseAuthContext,
): Promise<ApiResponse<ProfileResponse>> => {
  const api = createApiClient(authCtx);
  const result = await fetchMyProfile(api);

  if (result.isErr()) {
    return createErrorResponse(
      ERROR_CODES.PROFILE_NOT_FOUND,
      ERROR_MESSAGES_MAP[ERROR_CODES.PROFILE_NOT_FOUND],
      ERROR_STATUS_MAP[ERROR_CODES.PROFILE_NOT_FOUND],
    );
  }

  return createSuccessResponse(result.value);
};
