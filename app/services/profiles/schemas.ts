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

const RoleSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  level: z.number(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const ProfileResponseSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  role_id: z.number(),
  username: z.string().nullable(),
  full_name: z.string().nullable(),
  avatar_url: z.string(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
  role: RoleSchema,
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
