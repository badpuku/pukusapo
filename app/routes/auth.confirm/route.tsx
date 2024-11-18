import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { EmailOtpType } from "@supabase/supabase-js";
import { supabaseClient } from "~/services/supabase.server";
import { SignInQueryParams } from "~/models/auth";

/**
 * ログイン時のクエリパラメータを取得する関数。
 *
 * @param {URL} url - ローダー関数で受け取ったリクエストURL
 * @returns {{tokenHash: string, type: string, nextUrl: string}} クエリパラメータをひとまとめにしたオブジェクト。
 *
 * @example
 * ```typescript
 * const signInQueryParams = getSignInQueryParams(new URL(request.url));
 * ```
 */
const getQueryParams = (url: URL): SignInQueryParams => {
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const nextUrl = url.searchParams.get("next") ?? "/";

  return { tokenHash, type, nextUrl };
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // クエリパラメータから必要な情報を取得
  const signInQueryParams = getQueryParams(new URL(request.url));

  // リダイレクト先のURLがスラッシュで始まる場合はそのまま使用し、そうでなければルートページを設定
  const redirectTo = signInQueryParams.nextUrl.startsWith("/")
    ? signInQueryParams.nextUrl
    : "/";

  if (!signInQueryParams.tokenHash || !signInQueryParams.type) {
    return redirect("/error");
  }

  const { supabase } = supabaseClient(request);

  // Supabaseでトークンハッシュを使用したサインインを実行
  const { error } = await supabase.auth.verifyOtp({
    type: signInQueryParams.type,
    token_hash: signInQueryParams.tokenHash,
  });

  if (error) {
    return redirect("/error");
  }

  // TODO:: ログイン処理(セッションへのユーザ情報の保存など)を施してからホームに遷移させる
  return redirect(redirectTo);
};
