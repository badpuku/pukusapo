/**
 * APIエラーコード定数
 */
export const ERROR_CODES = {
  // 認証・認可エラー
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",

  // リクエストエラー
  INVALID_JSON: "INVALID_JSON",
  VALIDATION_ERROR: "VALIDATION_ERROR",

  // リソースエラー
  PROFILE_NOT_FOUND: "PROFILE_NOT_FOUND",
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",

  // データベースエラー
  DATABASE_ERROR: "DATABASE_ERROR",

  // メソッドエラー
  METHOD_NOT_ALLOWED: "METHOD_NOT_ALLOWED",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * エラーコードとHTTPステータスコードのマッピング
 */
export const ERROR_STATUS_MAP: Record<ErrorCode, number> = {
  [ERROR_CODES.INVALID_JSON]: 400,
  [ERROR_CODES.UNAUTHORIZED]: 401,
  [ERROR_CODES.FORBIDDEN]: 403,
  [ERROR_CODES.PROFILE_NOT_FOUND]: 403,
  [ERROR_CODES.RESOURCE_NOT_FOUND]: 404,
  [ERROR_CODES.METHOD_NOT_ALLOWED]: 405,
  [ERROR_CODES.VALIDATION_ERROR]: 422,
  [ERROR_CODES.DATABASE_ERROR]: 500,
  
} as const;

export const ERROR_MESSAGES_MAP: Record<ErrorCode, string> = {
  [ERROR_CODES.UNAUTHORIZED]: "認証が必要です。",
  [ERROR_CODES.FORBIDDEN]: "権限がありません。",
  [ERROR_CODES.METHOD_NOT_ALLOWED]: "メソッドが許可されていません。",
  [ERROR_CODES.INVALID_JSON]: "不正なJSONフォーマットです。",
  [ERROR_CODES.VALIDATION_ERROR]: "入力内容に誤りがあります。",
  [ERROR_CODES.PROFILE_NOT_FOUND]: "ユーザープロフィールが見つかりません。",
  [ERROR_CODES.RESOURCE_NOT_FOUND]: "リソースが見つかりません。",
  [ERROR_CODES.DATABASE_ERROR]: "データベースエラーが発生しました。",
} as const;
