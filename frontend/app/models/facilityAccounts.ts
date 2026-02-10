import { z } from "zod";

/**
 * 施設アカウント新規登録用入力スキーマ
 */
export const FacilityAccountInputSchema = z.object({
  userId: z
    .string()
    .min(1, { message: "ユーザーIDを入力してください" })
    .regex(/^\d{8}$/, { message: "ユーザーIDは8桁の数字で入力してください" }),
  password: z
    .string()
    .min(1, { message: "パスワードを入力してください" })
    .max(100, { message: "パスワードは100文字以内で入力してください" }),
  circleName: z
    .string()
    .max(100, { message: "サークル名は100文字以内で入力してください" })
    .optional()
    .or(z.literal("")),
  representativeName: z
    .string()
    .max(100, { message: "代表者名は100文字以内で入力してください" })
    .optional()
    .or(z.literal("")),
});

export type FacilityAccountInput = z.infer<typeof FacilityAccountInputSchema>;

/**
 * 施設アカウント更新用入力スキーマ（パスワードは任意）
 */
export const FacilityAccountUpdateInputSchema = z.object({
  userId: z
    .string()
    .min(1, { message: "ユーザーIDを入力してください" })
    .regex(/^\d{8}$/, { message: "ユーザーIDは8桁の数字で入力してください" }),
  password: z
    .string()
    .max(100, { message: "パスワードは100文字以内で入力してください" })
    .optional()
    .or(z.literal("")),
  circleName: z
    .string()
    .max(100, { message: "サークル名は100文字以内で入力してください" })
    .optional()
    .or(z.literal("")),
  representativeName: z
    .string()
    .max(100, { message: "代表者名は100文字以内で入力してください" })
    .optional()
    .or(z.literal("")),
});

export type FacilityAccountUpdateInput = z.infer<
  typeof FacilityAccountUpdateInputSchema
>;
