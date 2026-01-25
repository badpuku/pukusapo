import { PERMISSION_LEVELS } from "~/constants/roles";

/**
 * ユーザーが必要な権限レベルを満たしているかチェックする
 * 
 * @param userPermissionLevel ユーザーの権限レベル（null/undefinedの場合は0として扱う）
 * @param requiredLevel 必要な権限レベル
 * @returns 権限を持っている場合true
 */
export function hasMinimumPermissionLevel(
  userPermissionLevel: number | undefined | null,
  requiredLevel: number,
): boolean {
  return (userPermissionLevel ?? 0) >= requiredLevel;
}

/**
 * ユーザーがモデレーター以上の権限を持っているかチェックする
 * 
 * @param permissionLevel ユーザーの権限レベル
 * @returns モデレーター以上の場合true
 */
export function hasModeratorPermission(
  permissionLevel: number | undefined | null,
): boolean {
  return hasMinimumPermissionLevel(permissionLevel, PERMISSION_LEVELS.MODERATOR);
}

/**
 * ユーザーが管理者権限を持っているかチェックする
 * @param permissionLevel ユーザーの権限レベル
 * @returns 管理者の場合true
 */
export function hasAdminPermission(permissionLevel: number | undefined | null): boolean {
  return hasMinimumPermissionLevel(permissionLevel, PERMISSION_LEVELS.ADMIN);
}
