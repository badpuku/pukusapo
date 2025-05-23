import { ResultAsync } from "neverthrow";
import { type ActionFunctionArgs, redirect } from "react-router";

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
        throw redirect("/", {
          headers,
        });
      },
      (error) => {
        // TODO: エラーハンドリングを追加すること
        console.log(error);
        throw redirect("/error");
      },
    );
};
