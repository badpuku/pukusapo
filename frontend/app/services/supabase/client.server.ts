import { getAuth } from "@clerk/react-router/ssr.server";
import { createClient } from "@supabase/supabase-js";
import type { LoaderFunctionArgs } from "react-router";

import type { Database } from "~/models/supabase";

export const createServerSupabaseClient = (args: LoaderFunctionArgs) => {
  return createClient<Database>(
    args.context.cloudflare.env.SUPABASE_URL!,
    args.context.cloudflare.env.SUPABASE_ANON_KEY!,
    {
      async accessToken() {
        return (await getAuth(args)).getToken();
      },
    },
  );
};

export const createSecretSupabaseClient = (args: LoaderFunctionArgs) => {
  return createClient<Database>(
    args.context.cloudflare.env.SUPABASE_URL!,
    args.context.cloudflare.env.SUPABASE_SECRET_KEY!,
  );
};
