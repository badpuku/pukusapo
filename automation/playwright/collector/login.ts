import { type Browser, chromium, type Page } from "playwright";

import type { FacilityAccount } from "~/types";
import { ServerError } from "~playwright/collector/errors";

export type LoginResult = {
  success: boolean;
  page: Page;
  browser: Browser;
};

export async function login(account: FacilityAccount): Promise<LoginResult> {
  const browser = await chromium.launch({
    headless: process.env.HEADED !== "1",
    slowMo: 700,
  });

  try {
    const page = await browser.newPage();

    // ログインページへ遷移
    const response = await page.goto("https://yoyaku.harp.lg.jp/sapporo/Login", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // 503 等のサーバーエラーを検知
    if (response && response.status() >= 500) {
      throw new ServerError(response.status());
    }

    await page.getByRole("heading", { name: /ログイン/, level: 1 }).waitFor({ timeout: 30000, state: "visible" })

    // ログインフォームに入力
    await page.fill('input[name="userId"]', account.userId);
    await page.fill('input[name="password"]', account.password);

    // ログインボタンをクリック
    await page.getByRole("button", { name: "ログイン" }).click();

    // ページ遷移を待つ
    await page.waitForURL("**/sapporo/**", { timeout: 30000 });
    await page.getByRole("heading", { name: "施設検索"}).waitFor({ timeout: 10000, state: "visible" });

    return {
      success: true,
      page,
      browser,
    };
  } catch (error) {
    // ServerError はリトライ判定のため呼び出し元へ伝播させる
    if (error instanceof ServerError) {
      await browser.close();
      throw error;
    }

    console.error(
      `アカウント ${account.userId}: ログインに失敗しました:`,
      error,
    );
    return {
      success: false,
      page: null as unknown as Page,
      browser,
    };
  }
}
