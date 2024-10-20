import { sessionStorage } from "~/utils/server/session.server";
import { redirect } from "@remix-run/node";
import { ROUTES } from "~/constants/routes";

/**
 * ログアウト用関数
 */
export const logoutUser = async (request: Request) => {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );
  session.unset("userInfo");
  session.unset("accessToken");

  return redirect(ROUTES.LOGIN, {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
};
