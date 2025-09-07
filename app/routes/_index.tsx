import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/react-router";
import { getAuth } from "@clerk/react-router/ssr.server";
import { type MetaFunction, useLoaderData } from "react-router";

import { createServerSupabaseClient } from "~/services/supabase.server";

import type { Route } from "./+types/_index";

export const meta: MetaFunction = () => {
  return [
    { title: "pukusapo" },
    { name: "description", content: "フォーム作成・管理システム" },
  ];
};

/* export const loader = async ({ context, request }: Route.LoaderArgs) => {
  console.log("loader");
  const supabase = createServerSupabaseClient(request, context);
  const auth = await getAuth({ request, context });

  // Supabaseの接続状況を確認
  let supabaseStatus = false;
  let userProfile = null;

  try {
    // 接続確認
    const { error } = await supabase.from("profiles").select("*").limit(1);
    supabaseStatus = !error;
    console.log(error);

    // ログイン中の場合はプロファイル情報を取得
    if (auth.userId) {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(`
          *,
          roles (*)
        `)
        .eq("user_id", auth.userId)
        .single();

      if (!profileError && profileData) {
        userProfile = profileData;
      }
    }
  } catch (err) {
    console.error("Supabase operation failed:", err);
    supabaseStatus = false;
  }

  return {
    supabaseConnected: supabaseStatus,
    auth,
    userProfile,
  };
}; */

export default function Index() {
  /* const { supabaseConnected, auth, userProfile } =
    useLoaderData<typeof loader>(); */

  return (
    <p>test</p>
  );
}
