import { err, ok, ResultAsync } from "neverthrow";
import { type LoaderFunctionArgs, redirect } from "react-router";

import { SingUpConfirmQueryParamsSchema } from "~/models/auth";
import { supabaseClient } from "~/services/supabase.server";

export const loader = async ({ context, request }: LoaderFunctionArgs) => {
  const { supabase, headers } = supabaseClient(request, context);
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const next = url.searchParams.get("next");

  return await ok(
    SingUpConfirmQueryParamsSchema.safeParse({
      token_hash: tokenHash,
      type: type,
      next: next,
    }),
  )
    .andThen((result) => {
      if (!result.success) return err(result.error);
      return ok(result.data);
    })
    .asyncAndThen((result) => {
      const redirectTo = result.next ?? "/";

      return ResultAsync.fromPromise(
        supabase.auth.verifyOtp({
          type: result.type,
          token_hash: result.token_hash,
        }),
        (error) => error,
      ).map((response) => {
        if (response.error) {
          console.error("OTP verification error:", response.error);
          throw new Error(response.error.message);
        }
        return redirectTo;
      });
    })
    .match(
      (result) => {
        throw redirect(result, {
          headers: headers,
        });
      },
      (error) => {
        // TODO: エラーハンドリングを追加すること
        console.log(error);
        throw redirect("/error", {
          headers: headers,
        });
      },
    );
};
