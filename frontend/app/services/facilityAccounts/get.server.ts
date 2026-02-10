import {
  ERROR_CODES,
  ERROR_MESSAGES_MAP,
  ERROR_STATUS_MAP,
} from "~/constants/errors";
import {
  type ApiErrorResponse,
  type ApiResponse,
  createErrorResponse,
  createSuccessResponse,
} from "~/lib/apiResponse";
import type { ApiKeyAuthContext, AuthContext } from "~/lib/auth/types";
import { findAllFacilityAccounts, findFacilityAccountById } from "~/repositories/facilityAccounts.server";
import {
  type FacilityAccountResponse,
  FacilityAccountResponseSchema,
} from "~/services/facilityAccounts/schemas";
import { hasModeratorPermission } from "~/utils/permissions";

function checkModeratorPermission(
  authCtx: AuthContext | ApiKeyAuthContext,
): ApiErrorResponse | null {
  if ("profile" in authCtx) {
    const permissionLevel = authCtx.profile.roles.permission_level;
    if (!hasModeratorPermission(permissionLevel)) {
      return createErrorResponse(
        ERROR_CODES.FORBIDDEN,
        ERROR_MESSAGES_MAP[ERROR_CODES.FORBIDDEN],
        ERROR_STATUS_MAP[ERROR_CODES.FORBIDDEN],
      );
    }
  }
  return null;
}

export async function getFacilityAccountByIdService(
  authCtx: AuthContext | ApiKeyAuthContext,
  id: string,
): Promise<ApiResponse<FacilityAccountResponse>> {
  const permissionError = checkModeratorPermission(authCtx);
  if (permissionError) return permissionError;

  const supabase = authCtx.supabase;
  const { data: account, error: accountError } = await findFacilityAccountById(supabase, id);
  if (accountError) {
    return createErrorResponse(
      ERROR_CODES.DATABASE_ERROR,
      `[Supabase Error - findFacilityAccountById] ${accountError.code}: ${accountError.message}`,
      ERROR_STATUS_MAP[ERROR_CODES.DATABASE_ERROR],
    );
  }

  const accountData = FacilityAccountResponseSchema.safeParse(account);
  if (!accountData.success) {
    return createErrorResponse(
      ERROR_CODES.VALIDATION_ERROR,
      ERROR_MESSAGES_MAP[ERROR_CODES.VALIDATION_ERROR],
      ERROR_STATUS_MAP[ERROR_CODES.VALIDATION_ERROR],
    );
  }
  return createSuccessResponse(accountData.data);
}

export async function getFacilityAccountsService(
  authCtx: AuthContext | ApiKeyAuthContext,
  options: { offset?: number; limit?: number } = {},
): Promise<ApiResponse<FacilityAccountResponse[]>> {
  const permissionError = checkModeratorPermission(authCtx);
  if (permissionError) return permissionError;

  const { offset = 0, limit = 100 } = options;
  const supabase = authCtx.supabase;

  const { data: accounts, error: accountsError } = await findAllFacilityAccounts(supabase, { offset, limit });
  if (accountsError) {
    return createErrorResponse(
      ERROR_CODES.DATABASE_ERROR,
      `[Supabase Error - findAllFacilityAccounts] ${accountsError.code}: ${accountsError.message}`,
      ERROR_STATUS_MAP[ERROR_CODES.DATABASE_ERROR],
    );
  }
  const result = FacilityAccountResponseSchema.array().safeParse(accounts);
  if (!result.success) {
    return createErrorResponse(
      ERROR_CODES.VALIDATION_ERROR,
      ERROR_MESSAGES_MAP[ERROR_CODES.VALIDATION_ERROR],
      ERROR_STATUS_MAP[ERROR_CODES.VALIDATION_ERROR],
    );
  }

  return createSuccessResponse(result.data);
}
