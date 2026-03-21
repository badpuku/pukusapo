import { fetchMyProfile } from "~/api/profiles.server";
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
    const { status, error } = result.error;
    return createErrorResponse(error, error, status);
  }

  return createSuccessResponse(result.value);
};
