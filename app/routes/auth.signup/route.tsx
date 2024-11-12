import { type ActionFunctionArgs, redirect } from "@remix-run/node";
import { supabaseClient } from "~/services/supabase.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { supabase, headers } = supabaseClient(request);

  const formData = await request.formData();

  // Supabase でサインアップを実行
  const { data, error } = await supabase.auth.signUp({
    email: formData.get("email")?.toString() ?? "",
    password: formData.get("password")?.toString() ?? "",
  });

  if (error) {
    console.error(error);
    return redirect("/error", {
      headers,
    });
  }

  // TODO:: data変数からセッションを取り出してサインイン状態を保持する処理を記述する
  return redirect("/welcome", {
    headers,
  });
};
