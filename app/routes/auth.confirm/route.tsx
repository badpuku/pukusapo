import { LoaderFunctionArgs, redirect } from "@remix-run/cloudflare";
import { err, ok, ResultAsync } from "neverthrow";

import { SingUpConfirmQueryParamsSchema } from "~/models/auth";
import { supabaseClient } from "~/services/supabase.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { supabase, headers } = supabaseClient(request);
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
        return redirect(result, {
          headers: headers,
        });
      },
      (error) => {
        // TODO: エラーハンドリングを追加すること
        console.log(error);
        return redirect("/error", {
          headers: headers,
        });
      },
    );
};
