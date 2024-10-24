import { createCookieSessionStorage } from "@remix-run/node";
import { ROUTES } from "~/constants/routes";

const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
  throw new Error("SESSION_SECRET環境変数が設定されていません。");
}

/**
 * セッションストレージのインスタンス
 * クッキーを使用したセッション管理を実施する
 */
export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "remix_session",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24,
    httpOnly: true,
    path: ROUTES.ROOT,
    sameSite: "lax",
    secrets: [sessionSecret],
  },
});
