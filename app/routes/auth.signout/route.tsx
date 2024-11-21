import { type ActionFunctionArgs, redirect } from "@remix-run/node";
import { supabaseClient } from "~/services/supabase.server";
import { ResultAsync } from "neverthrow";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { supabase, headers } = supabaseClient(request);

  return ResultAsync.fromPromise(
    supabase.auth.signOut(),
    (error) => error
  ).map((response) => {
    if (response.error) {
      console.error("Sign out error:", response.error);
      throw new Error(response.error.message);
    }
  })
  .match(
    () => {
      return redirect("/", {
        headers,
      });
    },
    (error) => {
      // TODO: エラーハンドリングを追加すること
      console.log(error);
      return redirect("/error");
    }
  )
};
