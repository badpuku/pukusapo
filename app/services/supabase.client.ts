import { getAuth } from "@clerk/react-router/ssr.server";
import { createClient } from "@supabase/supabase-js";
import type { AppLoadContext } from "react-router";

export const createServerSupabaseClient = (
  request: Request,
  context: AppLoadContext,
) => {
  return createClient(
    context.cloudflare.env.SUPABASE_URL!,
    context.cloudflare.env.SUPABASE_ANON_KEY!,
    {
      async accessToken() {
        return (await getAuth({ request, context })).getToken();
      },
    },
  );
}
