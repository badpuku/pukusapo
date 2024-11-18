import { type EmailOtpType } from "@supabase/supabase-js";
import { z } from "zod";

/**
 * ログイン処理のクエリパラメータの型定義
 */
export type SignInQueryParams = {
  /**
   * トークンハッシュ値
   */
  tokenHash: string | null;
  /**
   * 認証のタイプ
   */
  type: EmailOtpType | null;
  /**
   * リダイレクト先URL
   */
  nextUrl: string;
};

export const EmailOtpTypeSchema = z.enum(["signup", "invite", "magiclink", "recovery", "email_change", "email"])satisfies z.ZodType<EmailOtpType>;

export const PathSchema = z.string().regex(/^\/[a-zA-Z0-9-_/]*$/);

/**
 * サインアップ確認時のクエリパラメータのスキーマ
 * 
 * TODO: next_url のバリデーションを追加する
 */
export const SingUpConfirmQueryParamsSchema = z.object({
  token_hash: z.string(),
  type: EmailOtpTypeSchema,
  next: z.union([PathSchema, z.null()]),
})
