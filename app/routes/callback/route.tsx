import { LoaderFunction, redirect } from "@remix-run/node";
import { getUserSession } from "~/services/auth.server";
import { sessionStorage } from "~/services/session.server";
import { supabaseClient } from "~/services/supabase.server";
import { ROUTES } from "~/constants/routes";

export const loader: LoaderFunction = async ({ request }) => {
  const { userInfo } = await getUserSession(request);

  if (userInfo && userInfo.userId) {
    // ログイン済みの場合はホームに飛ばす
    return redirect(ROUTES.ROOT);
  }

  // 未ログインの場合はログイン画面へ遷移
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  // codeがLINEから返却されなかった場合はエラーとして処理する
  if (!code) {
    throw new Error("必要な情報が返却されませんでした。");
  }

  // アクセストークンを取得
  const requestParam = {
    grant_type: "authorization_code",
    code,
    redirect_uri: process.env.VITE_LINE_CALLBACK_URL!,
    client_id: process.env.VITE_LINE_CLIENT_ID!,
    client_secret: process.env.VITE_LINE_CLIENT_SECRET!,
  };

  const tokenResponse = await fetch(process.env.VITE_LINE_TOKEN_BASE_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(requestParam).toString(),
  });

  if (!tokenResponse.ok) {
    throw new Error(`サーバーからの応答が異常です： ${tokenResponse.status}`);
  }

  const tokenResponseData = await tokenResponse.json();
  const accessToken = tokenResponseData.access_token;

  // ユーザ情報の取得処理
  const userInfoResponse = await fetch(
    process.env.VITE_LINE_PROFILE_BASE_URL!,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    }
  );

  if (!userInfoResponse.ok) {
    throw new Error(
      `サーバーからの応答が異常です： ${userInfoResponse.status}`
    );
  }

  const userInfoResponseData = await userInfoResponse.json();

  // 既存ユーザからデータ取得
  const { data: existingUser, error: fetchError } = await supabaseClient
    .from("users")
    .select("*")
    .eq("id", userInfoResponseData.userId)
    .single();

  if (fetchError) {
    console.error("Error get user info:", fetchError);
    throw new Error("データ取得に失敗しました。");
  }

  // 新規ユーザ登録
  if (!existingUser) {
    const { error: signUpError } = await supabaseClient.from("users").insert([
      {
        id: userInfoResponseData.userId,
        email: "",
        name: userInfoResponseData.displayName,
        profile: userInfoResponseData.pictureUrl,
      },
    ]);

    if (signUpError) {
      console.error("Error signing up user:", signUpError);
      throw new Error("ユーザ登録に失敗しました。");
    }
  }

  const session = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );

  // TODO::セッションに保存するユーザ情報の型定義について検討する必要あり
  session.set("userInfo", {
    userId: userInfoResponseData.userId,
    name: userInfoResponseData.displayName,
    pictureUrl: userInfoResponseData.pictureUrl,
  });
  session.set("accessToken", accessToken);

  // 成功時の処理
  return redirect(ROUTES.ROOT, {
    headers: { "Set-Cookie": await sessionStorage.commitSession(session) },
  });
};
