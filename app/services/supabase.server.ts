import {
  createServerClient,
  parseCookieHeader,
  serializeCookieHeader,
} from "@supabase/ssr";

/**
 * Supabaseクライアントを作成する関数。
 *
 * @param {Request} request - クライアントからのリクエストオブジェクト。
 * @returns {{ supabase: any, headers: Headers }} Supabaseクライアントとヘッダーオブジェクトを含むオブジェクト。
 *
 * @example
 * ```typescript
 * const { supabase, headers } = supabaseClient(request);
 * ```
 */
export const supabaseClient = (request: Request) => {
  const headers = new Headers();

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
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
