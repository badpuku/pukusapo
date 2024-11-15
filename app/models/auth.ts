import { EmailOtpType } from "@supabase/supabase-js";

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
