import { ActionFunction } from "@remix-run/node";
import { sessionStorage } from "~/services/session.server";

export const action: ActionFunction = async ({ request }) => {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );

  session.unset("userInfo");
  session.unset("accessToken");

  const cookie = await sessionStorage.commitSession(session);

  const isLoggedOut = !session.has("userInfo") && !session.has("accessToken");
  const responseMessage = isLoggedOut
    ? "ログアウトが成功しました"
    : "ログアウトに失敗しました";

  return new Response(
    JSON.stringify({
      success: isLoggedOut,
      message: responseMessage,
    }),
    {
      headers: {
        "Set-Cookie": cookie,
        "Content-Type": "application/json",
      },
    }
  );
};
