import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/react-router";
import { getAuth } from "@clerk/react-router/ssr.server";
import { type MetaFunction, useLoaderData } from "react-router";

import { createServerSupabaseClient } from "~/services/supabase/client.server";
import { getProfileByUserId } from "~/services/supabase/profiles";

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

  if(!auth.isAuthenticated) {
    return {
      userProfile: null,
    };
  }

  const profileResponse = auth.userId
    ? await getProfileByUserId(supabase, auth.userId)
    : null;

  return {
    userProfile: profileResponse?.data || null,
  };
};

export default function Index() {
  const { userProfile } = useLoaderData<typeof loader>();

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
                    <p>ユーザー名: {userProfile.username || "未設定"}</p>
                    <p>
                      ロール: {userProfile.roles?.name} ({userProfile.roles?.code}
                      )
                    </p>
                  </div>
                )}
              </div>
              <UserButton />
            </div>
          </div>
        </SignedIn>
      </div>
    </div>
  );
}
