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
import { findAllFacilityCollectionJobs, findFacilityCollectionJobById } from "~/repositories/facilityCollectionJob.server";
import { type FacilityCollectionJobResponse,FacilityCollectionJobResponseSchema } from "~/services/facilityCollectionJobs/schemas";
import { hasAdminPermission } from "~/utils/permissions";

/**
 * 収集ジョブを取得する
 */
export async function getFacilityCollectionJobService(
  authCtx: AuthContext | ApiKeyAuthContext,
  id?: number,
): Promise<ApiResponse<FacilityCollectionJobResponse[]>> {
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
  if (id) {
    const { data: collectionJob, error: collectionJobError } = await findFacilityCollectionJobById(supabase, id);
    if (collectionJobError) {
      return createErrorResponse(
        ERROR_CODES.DATABASE_ERROR,
        `[Supabase Error - findFacilityCollectionJobById] ${collectionJobError.code}: ${collectionJobError.message}`,
        ERROR_STATUS_MAP[ERROR_CODES.DATABASE_ERROR],
      );
    }

    const collectionJobData = FacilityCollectionJobResponseSchema.safeParse(collectionJob);
    if (!collectionJobData.success) {
      return createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        ERROR_MESSAGES_MAP[ERROR_CODES.VALIDATION_ERROR],
        ERROR_STATUS_MAP[ERROR_CODES.VALIDATION_ERROR],
      );
    }
    return createSuccessResponse([collectionJobData.data]);
  }

  const { data: collectionJobs, error: collectionJobsError } = await findAllFacilityCollectionJobs(
    supabase,
  );

  if (collectionJobsError) {
    return createErrorResponse(
      ERROR_CODES.DATABASE_ERROR,
      `[Supabase Error - findAllFacilityCollectionJobs] ${collectionJobsError.code}: ${collectionJobsError.message}`,
      ERROR_STATUS_MAP[ERROR_CODES.DATABASE_ERROR],
    );
  }

  const result = FacilityCollectionJobResponseSchema.array().safeParse(collectionJobs);
  if (!result.success) {
    return createErrorResponse(
      ERROR_CODES.VALIDATION_ERROR,
      ERROR_MESSAGES_MAP[ERROR_CODES.VALIDATION_ERROR],
      ERROR_STATUS_MAP[ERROR_CODES.VALIDATION_ERROR],
    );
  }

  return createSuccessResponse(result.data);
}
