import { type ActionFunctionArgs, redirect } from "@remix-run/node";

import { supabaseClient } from "~/services/supabase.server";
import { err, ok, ResultAsync } from "neverthrow";
import { EmailAuthSchema } from "~/models/auth";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { supabase, headers } = supabaseClient(request);
  const formData = await request.formData();

  return ok (
    EmailAuthSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    })
  )
  .andThen((result) => {
    if (!result.success) return err(result.error);
    return ok(result.data);
  })
  .asyncAndThen((result) => {
    return ResultAsync.fromPromise(
      supabase.auth.signInWithPassword({
        email: result.email,
        password: result.password,
      }),
      (error) => error
    ).map((response) => {
      if (response.error) {
        console.error("Sign in error:", response.error);
        throw new Error(response.error.message);
      }
      return redirect("/");
    });
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
  );
};
