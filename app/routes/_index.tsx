import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/react-router";
import { type MetaFunction, useLoaderData } from "react-router";

import { supabaseClient } from "~/services/supabase.server";

import type { Route } from "./+types/_index";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export const loader = async ({ context, request }: Route.LoaderArgs) => {
  const supabase = supabaseClient(request, context);
  // const { user } = await getAuthenticatedUser(request, context);

  return {
    //user,
    supabase: !!supabase, // Supabaseクライアントが存在するかどうかのみ返す
  };
};

export default function Index() {
  const { supabase } = useLoaderData<typeof loader>();
  console.log("supabase", supabase);

  return (
    <>
      <h1>トップページ</h1>

      <SignedOut>
        <SignInButton />
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>

      {/* 環境表示 */}
      <div className="mb-4 p-2 bg-gray-100 rounded">
        <p className="text-sm">Supabase接続: {supabase ? "✅" : "❌"}</p>
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
