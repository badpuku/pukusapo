import { redirect, LoaderFunction } from "@remix-run/node";
import { getUserSession } from "~/utils/auth.server";

export const loader: LoaderFunction = async ({ request }) => {
  const { userInfo } = await getUserSession(request);
  console.log(userInfo);

  if (userInfo && userInfo.userId) {
    // ログイン済みの場合はホームに飛ばす
    return redirect("/");
  }

  // 未ログインの場合はLineのログイン画面に飛ばす
  const clientId = process.env.VITE_LINE_CLIENT_ID!;
  const redirectUri = process.env.VITE_LINE_CALLBACK_URL!;

  const url = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&state=random_state_string&scope=openid%20profile`;
  return redirect(url);
};
