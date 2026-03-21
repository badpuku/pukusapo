import {
  ERROR_CODES,
  ERROR_MESSAGES_MAP,
  ERROR_STATUS_MAP,
} from "~/constants/errors";
import {
  type ApiResponse,
  createErrorResponse,
  createSuccessResponse,
} from "~/lib/apiResponse";
import type { ApiKeyAuthContext, AuthContext } from "~/lib/auth/types";
import { createFacilityCollectionJob } from "~/repositories/facilityCollectionJob.server";
import { hasAdminPermission } from "~/utils/permissions";

/**
 * 収集ジョブを作成する
 */
export async function createFacilityCollectionJobService(
  authCtx: AuthContext | ApiKeyAuthContext,
): Promise<ApiResponse<{ id: number }>> {
  // 権限チェック
  if ("profile" in authCtx) {
    const permissionLevel = authCtx.profile.role.permission_level;
    if (!hasAdminPermission(permissionLevel)) {
      return createErrorResponse(
        ERROR_CODES.FORBIDDEN,
        ERROR_MESSAGES_MAP[ERROR_CODES.FORBIDDEN],
        ERROR_STATUS_MAP[ERROR_CODES.FORBIDDEN],
      );
    }
  }

  const supabase = authCtx.supabase;
  const { data: collectionJob, error: collectionJobError } = await createFacilityCollectionJob(
    supabase,
    {
      status: "running",
    },
  );

  if (collectionJobError) {
    return createErrorResponse(
      ERROR_CODES.DATABASE_ERROR,
      `[Supabase Error - createFacilityCollectionJob] ${collectionJobError.code}: ${collectionJobError.message}`,
      ERROR_STATUS_MAP[ERROR_CODES.DATABASE_ERROR],
    );
  }
  return createSuccessResponse({ id: collectionJob.id });
}
