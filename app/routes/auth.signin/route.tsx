import { type ActionFunctionArgs, redirect } from "@remix-run/node";
import { supabaseClient } from "~/services/supabase.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { supabase, headers } = supabaseClient(request);

  const formData = await request.formData();

  // Supabase でメール&パスワードログインを実行
  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.get("email")?.toString() ?? "",
    password: formData.get("password")?.toString() ?? "",
  });

  if (error) {
    return { error: error.message };
  }

  return redirect("/", {
    headers,
  });
};
