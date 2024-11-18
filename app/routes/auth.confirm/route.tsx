import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { EmailOtpType } from "@supabase/supabase-js";
import { supabaseClient } from "~/services/supabase.server";
import { SignInQueryParams, SingUpConfirmQueryParamsSchema } from "~/models/auth";
import { err, ok, ResultAsync } from "neverthrow";

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
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const next = url.searchParams.get("next") ?? "/";

  return await ok (
    SingUpConfirmQueryParamsSchema.safeParse({
      token_hash: tokenHash,
      type: type,
      next: next,
    })
  )
  .andThen((result) => {
    if (!result.success) return err(result.error);
    return ok(result.data);
  })
  .asyncAndThen((result) => {
    const redirectTo = result.next ?? "/";
    const { supabase } = supabaseClient(request);

    return ResultAsync.fromPromise(
      supabase.auth.verifyOtp({
        type: result.type,
        token_hash: result.token_hash,
      }),
      (error) => error
    ).map((response) => {
      if (response.error) {
        console.error("OTP verification error:", response.error);
        throw new Error(response.error.message);
      }
      return redirectTo;
    })
  })
  .match(
    (result) => {
      return redirect(result);
    },
    (error) => {
      // TODO: エラーハンドリングを追加すること
      console.log(error);
      return redirect("/error");
    }
  )
};
