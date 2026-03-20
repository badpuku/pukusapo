import type { ApiClient } from "~/lib/apiClient.server";
import {
  type ProfileResponse,
  ProfileResponseSchema,
} from "~/services/profiles/schemas";

export const fetchMyProfile = (api: ApiClient) => {
  return api.get<ProfileResponse>("/v1/profiles/me", ProfileResponseSchema);
};
