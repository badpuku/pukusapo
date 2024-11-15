import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { EmailOtpType } from "@supabase/supabase-js";
import { supabaseClient } from "~/services/supabase.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  // クエリパラメータから必要な情報を取得
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = url.searchParams.get("next") ?? "/";

  // リダイレクト先のURLがスラッシュで始まる場合はそのまま使用し、そうでなければルートページを設定
  const redirectTo = next.startsWith("/") ? next : "/";

  if (!token_hash || !type) {
    return redirect("/error");
  }

  const { supabase } = supabaseClient(request);

  // Supabaseでトークンハッシュを使用したサインインを実行
  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash,
  });

  if (error) {
    return redirect("/error");
  }

  // TODO:: ログイン処理(セッションへのユーザ情報の保存など)を施してからホームに遷移させる
  return redirect(redirectTo);
};
