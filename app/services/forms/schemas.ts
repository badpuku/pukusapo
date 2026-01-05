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

/**
 * フォーム一覧APIレスポンスのスキーマ定義
 */
export const FormsListSchema = z.object({
  success: z.boolean(),
  data: z.array(FormResponseSchema).nullable(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
    })
    .optional(),
  status: z.number(),
});

export type FormsListResponse = z.infer<typeof FormsListSchema>;

/**
 * フォーム一覧取得パラメータのスキーマ定義
 */
export const FormsListParamsSchema = z.object({
  offset: z.number().default(0),
  limit: z.number().default(10),
});

export type FormsListParams = z.infer<typeof FormsListParamsSchema>;
