import { z } from "zod";

import { FORM_STATUS } from "~/models/forms";
import { FormFieldsResponseSchema } from "~/services/formFields/schemas";

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

export const FormWithFieldsResponseSchema = z.object({
  ...FormResponseSchema.shape,
  fields: z.array(FormFieldsResponseSchema),
});

export type FormWithFieldsResponse = z.infer<typeof FormWithFieldsResponseSchema>;

/**
 * フォーム一覧取得パラメータのスキーマ定義
 */
export const FormsListParamsSchema = z.object({
  offset: z.number().default(0),
  limit: z.number().default(10),
});

export type FormsListParams = z.infer<typeof FormsListParamsSchema>;
