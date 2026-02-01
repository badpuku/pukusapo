import { z } from "zod";

/**
 * 施設アカウントレスポンスのスキーマ定義
 */
export const FacilityAccountResponseSchema = z.object({
  id: z.string(),
  profile_id: z.string(),
  user_id: z.string(),
  circle_name: z.string().nullable(),
  representative_name: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type FacilityAccountResponse = z.infer<
  typeof FacilityAccountResponseSchema
>;

/**
 * 施設アカウント一覧取得パラメータのスキーマ定義
 */
export const FacilityAccountsListParamsSchema = z.object({
  offset: z.number().default(0),
  limit: z.number().default(10),
});

export type FacilityAccountsListParams = z.infer<
  typeof FacilityAccountsListParamsSchema
>;
