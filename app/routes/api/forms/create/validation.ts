import { z } from "zod";

/**
 * フォーム作成リクエストのバリデーションスキーマ
 */
export const createFormSchema = z.object({
  title: z
    .string()
    .min(1, "タイトルは必須です")
    .max(200, "タイトルは200文字以内で入力してください")
    .refine((val) => val.trim().length > 0, {
      message: "タイトルは空白のみにできません",
    })
    .transform((val) => val.trim()),
  description: z.string().optional(),
  status: z.enum(["draft", "published"]).default("draft"),
});

export type CreateFormInput = z.infer<typeof createFormSchema>;
