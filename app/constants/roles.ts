// ロールタイプ
export const ROLE_TYPES = {
  USER: "user",
  MODERATOR: "moderator",
  ADMIN: "admin",
} as const;

export type RoleType = (typeof ROLE_TYPES)[keyof typeof ROLE_TYPES];

// 権限レベル
export const PERMISSION_LEVELS = {
  USER: 0,
  MODERATOR: 5,
  ADMIN: 10,
} as const;
