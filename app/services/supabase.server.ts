import {
  createServerClient,
  parseCookieHeader,
  serializeCookieHeader,
} from "@supabase/ssr";
import { AppLoadContext } from "react-router";

/**
 * Supabaseクライアントを作成する関数。
 *
 * @param {Request} request - クライアントからのリクエストオブジェクト。
 * @param {AppLoadContext} context - RemixのAppLoadContextオブジェクト（環境変数を提供するコンテキスト）。
 * @returns {{ supabase: any, headers: Headers }} Supabaseクライアントとヘッダーオブジェクトを含むオブジェクト。
 *
 * @example
 * ```typescript
 * const { supabase, headers } = supabaseClient(request, context);
 * ```
 */
export const supabaseClient = (request: Request, context: AppLoadContext) => {
  const headers = new Headers();

  const supabase = createServerClient(
    context.cloudflare.env.SUPABASE_URL!,
    context.cloudflare.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(request.headers.get("Cookie") ?? "");
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            headers.append(
              "Set-Cookie",
              serializeCookieHeader(name, value, options),
            ),
          );
        },
      },
    },
  );

  return { supabase, headers };
};
