import { err, ok, ResultAsync } from "neverthrow";
import { type ActionFunctionArgs, redirect } from "react-router";

import { EmailAuthSchema } from "~/models/auth";
import { supabaseClient } from "~/services/supabase.server";

export const action = async ({ context, request }: ActionFunctionArgs) => {
  const { supabase } = supabaseClient(request, context);
  const formData = await request.formData();

  return ok(
    EmailAuthSchema.pick({ password: true }).safeParse({
      password: formData.get("password"),
    }),
  )
    .andThen((result) => {
      if (!result.success) return err(result.error);
      return ok(result.data);
    })
    .asyncAndThen((result) => {
      return ResultAsync.fromPromise(
        supabase.auth.updateUser({ password: result.password }),
        (error) => error,
      ).map((response) => {
        if (response.error) {
          console.error("Password reset error:", response.error);
          throw new Error(response.error.message);
        }
      });
    })
    .match(
      () => {
        throw redirect("/password-reset/completed");
      },
      (error) => {
        // TODO: エラーハンドリングを追加すること
        console.log(error);
        throw redirect("/error");
      },
    );
};
