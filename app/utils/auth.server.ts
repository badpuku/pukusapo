import { sessionStorage } from "./session.server";
import { redirect } from "@remix-run/node";

/**
 * userInfo取得用関数
 */
export const getUserSession = async (request: Request) => {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );
  const userInfo = session.get("userInfo");

  return { session, userInfo };
};

/**
 * ログアウト用関数
 */
export const logoutUser = async (request: Request) => {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );
  session.unset("userInfo");
  session.unset("accessToken");

  return redirect("/login", {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
};
