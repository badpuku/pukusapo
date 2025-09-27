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

export const loader = async (args: Route.LoaderArgs) => {
  const supabase = createServerSupabaseClient(args);
  const auth = await getAuth(args);

  // Supabaseの接続状況を確認
  let supabaseStatus = false;
  let userProfile = null;
  // TODO: 削除
  let profileError = null;

  try {
    // 接続確認
    const { error } = await supabase.from("profiles").select("*").limit(1);
    supabaseStatus = !error;

    // TODO: 削除
    profileError = error;

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
    supabase,
    // TODO: 削除
    error: profileError,
  };
};

export default function Index() {
  const { supabaseConnected, auth, userProfile, error } =
    useLoaderData<typeof loader>();

  // TODO: 削除
  console.log("error", error);


  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">pukusapo</h1>
      <p className="text-gray-600 mb-8">フォーム作成・管理システム</p>

      {/* 認証状態 */}
      <div className="mb-6">
        <SignedOut>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 mb-4">サインインしてください</p>
            <SignInButton mode="modal">
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                サインイン
              </button>
            </SignInButton>
          </div>
        </SignedOut>
        <SignedIn>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-800 font-semibold">ログイン中</p>
                {userProfile && (
                  <div className="mt-2 text-sm text-green-700">
                    <p>名前: {userProfile.full_name || "未設定"}</p>
                    <p>
                      ユーザー名: {userProfile.username || "未設定"}
                    </p>
                    <p>
                      ロール: {userProfile.roles?.name} ({userProfile.roles?.code})
                    </p>
                  </div>
                )}
              </div>
              <UserButton />
            </div>
          </div>
        </SignedIn>
      </div>

      {/* システム状態 */}
      <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">システム状態</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">データベース接続:</span>
            <span
              className={`ml-2 ${supabaseConnected ? "text-green-600" : "text-red-600"}`}
            >
              {supabaseConnected ? "✅ 接続成功" : "❌ 接続失敗"}
            </span>
          </div>
          <div>
            <span className="font-medium">認証状態:</span>
            <span
              className={`ml-2 ${auth.userId ? "text-green-600" : "text-gray-600"}`}
            >
              {auth.userId ? "✅ 認証済み" : "❌ 未認証"}
            </span>
          </div>
        </div>
      </div>

      {/* デバッグ情報（開発環境のみ） */}
      {process.env.NODE_ENV === "development" && (
        <details className="mb-6 p-4 bg-gray-100 border border-gray-300 rounded-lg">
          <summary className="cursor-pointer font-medium">デバッグ情報</summary>
          <div className="mt-4 space-y-2">
            <div>
              <h3 className="font-semibold">認証情報:</h3>
              <pre className="text-xs bg-white p-2 rounded overflow-auto">
                {JSON.stringify(auth, null, 2)}
              </pre>
            </div>
            {userProfile && (
              <div>
                <h3 className="font-semibold">ユーザープロファイル:</h3>
                <pre className="text-xs bg-white p-2 rounded overflow-auto">
                  {JSON.stringify(userProfile, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  );
}
