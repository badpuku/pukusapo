import { z } from "zod";

import { FieldDraftSchema } from "~/models/formFields";

export const FORM_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
} as const;

export type FormStatus = (typeof FORM_STATUS)[keyof typeof FORM_STATUS];

export const FormInputSchema = z.object({
  title: z
    .string()
    .min(1, { message: "タイトルを入力してください" })
    .max(200, { message: "タイトルは200文字以内で入力してください" })
    .refine((val) => val.trim().length > 0, {
      message: "タイトルは空白のみにできません",
    })
    .transform((val) => val.trim()),
  description: z
    .string()
    .max(1000, { message: "概要は1000文字以内で入力してください" })
    .optional()
    .or(z.literal("")),
  status: z
    .enum([FORM_STATUS.DRAFT, FORM_STATUS.PUBLISHED])
    .default(FORM_STATUS.DRAFT),
});

export type FormInput = z.infer<typeof FormInputSchema>;

/**
 * フォーム作成時の入力スキーマ（フィールド配列を含む）
 */
export const FormWithFieldsInputSchema = FormInputSchema.extend({
  fields: z.array(FieldDraftSchema).optional().default([]),
});

export type FormWithFieldsInput = z.infer<typeof FormWithFieldsInputSchema>;
