import { redirect, LoaderFunction } from "@remix-run/node";
import { ROUTES } from "~/constants/routes";
import { getUserSession } from "~/services/auth.server";

export const loader: LoaderFunction = async ({ request }) => {
  const { userInfo } = await getUserSession(request);

  // ログイン済みの場合はホームへ遷移させる
  if (userInfo && userInfo.userId) {
    return redirect(ROUTES.ROOT);
  }

  const clientId = process.env.VITE_LINE_CLIENT_ID!;
  const redirectUri = process.env.VITE_LINE_CALLBACK_URL!;

  const url = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&state=random_state_string&scope=openid%20profile`;
  return redirect(url);
};
