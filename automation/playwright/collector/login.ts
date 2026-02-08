import { type Browser, chromium, type Page } from "playwright";

import type { FacilityAccount } from "~/types";

export type LoginResult = {
  success: boolean;
  page: Page;
  browser: Browser;
};

export async function login(account: FacilityAccount): Promise<LoginResult> {
  const browser = await chromium.launch({
    headless: process.env.HEADED !== "1",
    slowMo: 500,
  });
  const page = await browser.newPage();

  // ログインページへ遷移
  await page.goto("https://yoyaku.harp.lg.jp/sapporo/Login", {
    waitUntil: "networkidle",
  });

  // ログインフォームに入力
  await page.fill('input[name="userId"]', account.userId);
  await page.fill('input[name="password"]', account.password);

  // ログインボタンをクリック
  await page.getByRole("button", { name: "ログイン" }).click();

  // ページ遷移を待つ
  await page.waitForURL("**/sapporo/**");

  return {
    success: true,
    page,
    browser,
  };
}
