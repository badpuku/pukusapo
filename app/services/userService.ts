import { sessionStorage } from "~/utils/server/session.server";

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
