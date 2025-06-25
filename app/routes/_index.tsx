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
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export const loader = async ({ context, request }: Route.LoaderArgs) => {
  const supabase = createServerSupabaseClient(request, context);
  const auth = await getAuth({ request, context });

  // Supabaseの接続状況を確認
  let supabaseStatus = false;
  try {
    // 簡単なクエリでSupabaseの接続を確認
    const { error } = await supabase
      .from("profiles")
      .select("count", { count: "exact", head: true });
    supabaseStatus = !error;
  } catch (err) {
    console.error("Supabase connection check failed:", err);
    supabaseStatus = false;
  }

  return {
    supabaseConnected: supabaseStatus, // 接続状況のみを返す
    auth,
  };
};

export default function Index() {
  const { supabaseConnected, auth } = useLoaderData<typeof loader>();

  console.log("supabaseConnected", supabaseConnected);
  console.log("auth", auth);

  return (
    <>
      <h1>トップページ</h1>
      <p>Supabase接続状況</p>
      <p>{supabaseConnected ? "✅ 接続成功" : "❌ 接続失敗"}</p>
      <p>auth</p>
      <pre>{JSON.stringify(auth, null, 2)}</pre>

      <SignedOut>
        <SignInButton />
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>

      {/* 環境表示 */}
      <div className="mb-4 p-2 bg-gray-100 rounded">
        <p className="text-sm">
          Supabase接続: {supabaseConnected ? "✅" : "❌"}
        </p>
      </div>

      {/* ユーザー情報表示 */}
      {/* {user ? (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded">
          <p className="text-green-800">ログイン中: {user.id}</p>
        </div>
      ) : (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-yellow-800">未ログイン</p>
        </div>
      )} */}
    </>
  );
}
