import { type ActionFunctionArgs, redirect } from "@remix-run/cloudflare";
import { ResultAsync } from "neverthrow";

import { supabaseClient } from "~/services/supabase.server";

export const action = async ({ context, request }: ActionFunctionArgs) => {
  const { supabase, headers } = supabaseClient(request, context);

  return ResultAsync.fromPromise(supabase.auth.signOut(), (error) => error)
    .map((response) => {
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
      },
    );
};
