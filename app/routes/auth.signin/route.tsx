import { type ActionFunctionArgs, redirect } from "@remix-run/node";

import { supabaseClient } from "~/services/supabase.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { supabase, headers } = supabaseClient(request);

  // Supabase で匿名ログインを実行
  const { error } = await supabase.auth.signInAnonymously();

  if (error) {
    return { error: error.message };
  }

  return redirect("/", {
    headers,
  });
};
