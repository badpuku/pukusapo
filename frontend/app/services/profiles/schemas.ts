import { z } from "zod";

import { FORM_STATUS } from "~/models/forms";

/**
 * フォームレスポンスのスキーマ定義
 */
export const FormResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  status: z.enum([FORM_STATUS.DRAFT, FORM_STATUS.PUBLISHED]),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

export type FormResponse = z.infer<typeof FormResponseSchema>;

const RolesSchema = z.object({
  code: z.string(),
  name: z.string(),
  permission_level: z.number(),
});

export const ProfileResponseSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  username: z.string().nullable(),
  full_name: z.string().nullable(),
  avatar_url: z.string(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
  role: RolesSchema,
});

export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;


/**
 * フォーム一覧取得パラメータのスキーマ定義
 */
export const FormsListParamsSchema = z.object({
  offset: z.number().default(0),
  limit: z.number().default(10),
});

export type FormsListParams = z.infer<typeof FormsListParamsSchema>;
