import { LoaderFunction, redirect } from "@remix-run/node";
import axios from "axios";
import { getUserSession } from "~/services";
import { sessionStorage } from "~/utils/server/session.server";
import { supabaseClient} from "~/services/supabase.server";
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
  const redirectUri = process.env.VITE_LINE_CALLBACK_URL!;
  const channelId = process.env.VITE_LINE_CLIENT_ID!;
  const channelSecret = process.env.VITE_LINE_CLIENT_SECRET!;
  const tokenBaseUrl = process.env.VITE_LINE_TOKEN_BASE_URL!;
  const profileBaseUrl = process.env.VITE_LINE_PROFILE_BASE_URL!;

  // アクセストークンを取得
  const requestParam = {
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: channelId,
    client_secret: channelSecret,
  };

  const tokenResponse = await axios.post(tokenBaseUrl, requestParam, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  const accessToken = tokenResponse.data.access_token;

  const userInfoResponse = await axios.get(profileBaseUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const createUserInfo = {
    userId: userInfoResponse.data?.userId,
    name: userInfoResponse.data?.displayName,
    pictureUrl: userInfoResponse.data?.pictureUrl,
  };

  // 既存ユーザからデータ取得
  const { data: existingUser, error: fetchError } = await supabaseClient
    .from("users")
    .select("*")
    .eq("id", createUserInfo.userId)
    .single();

  // 既存データ取得処理での例外
  if (fetchError) {
    console.error(fetchError);
  }

  // 新規ユーザ登録
  if (!existingUser) {
    const { error: signUpError } = await supabaseClient.from("users").insert([
      {
        id: createUserInfo.userId,
        email: "",
        name: createUserInfo.name,
        profile: createUserInfo.pictureUrl,
      },
    ]);

    if (signUpError) {
      console.error("Error signing up user:", signUpError);
    }
  }

  const session = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );
  session.set("userInfo", createUserInfo);
  session.set("accessToken", accessToken);

  // 成功時の処理
  return redirect(ROUTES.ROOT, {
    headers: { "Set-Cookie": await sessionStorage.commitSession(session) },
  });
};
