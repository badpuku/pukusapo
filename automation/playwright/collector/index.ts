import {
  type Account,
  type Reservation,
  RESERVATION_STATUS_MAP,
} from "~/types";
import { login } from "~playwright/collector/login";

// 改行・連続空白を整形するヘルパー
const normalize = (str: string | null) =>
  str?.replace(/\s+/g, " ").trim() || "";

// タイムアウト設定（ミリ秒）
const TIMEOUT = {
  PAGE_LOAD: 15000,
  ELEMENT_ACTION: 5000,
  ELEMENT_VISIBLE: 3000,
} as const;

export async function fetchReservations(
  account: Account,
): Promise<Reservation[]> {
  const { success, page, browser } = await login(account);

  if (!success) {
    await browser.close();
    return [];
  }

  try {
    const reservations: Reservation[] = [];
    const filterText = "本予約";

    // 申込状況リンクの存在確認（有効期限切れの場合は表示されない）
    const applicationLink = page
      .locator("#main")
      .getByRole("link", { name: "申込状況", exact: true });
    const isLinkVisible = await applicationLink
      .isVisible({ timeout: TIMEOUT.ELEMENT_VISIBLE })
      .catch(() => false);

    if (!isLinkVisible) {
      console.log(
        `アカウント ${account.userId} は有効期限切れのため、スキップします。`,
      );
      return [];
    }

    // 申込状況ページへ遷移
    const clickSuccess = await applicationLink
      .click({ timeout: TIMEOUT.ELEMENT_ACTION })
      .then(() => true)
      .catch(() => false);
    if (!clickSuccess) {
      console.log(
        `アカウント ${account.userId}: 申込状況リンクのクリックに失敗、スキップします。`,
      );
      return [];
    }

    await page
      .waitForLoadState("networkidle", { timeout: TIMEOUT.PAGE_LOAD })
      .catch(() => {
        console.log(
          `アカウント ${account.userId}: ページ読み込みタイムアウト、処理を継続します。`,
        );
      });

    // フィルターを選択
    const filterButtonClicked = await page
      .getByRole("button", { name: "すべての状態" })
      .click({ timeout: TIMEOUT.ELEMENT_ACTION })
      .then(() => true)
      .catch(() => false);
    if (!filterButtonClicked) {
      console.log(
        `アカウント ${account.userId}: フィルターボタンのクリックに失敗、スキップします。`,
      );
      return [];
    }

    // 当選フィルターを選択
    const filterSelected = await page
      .getByRole("button", { name: filterText, exact: true })
      .click({ timeout: TIMEOUT.ELEMENT_ACTION })
      .then(() => true)
      .catch(() => false);
    if (!filterSelected) {
      console.log(
        `アカウント ${account.userId}: 当選フィルターの選択に失敗、スキップします。`,
      );
      return [];
    }

    // 当選件数を確認
    const paginationText = await page
      .getByText(/\d+\s*件目/)
      .textContent({ timeout: TIMEOUT.ELEMENT_ACTION })
      .catch(() => null);
    const match = paginationText?.match(/(\d+)\s*件目/);

    console.log(match);

    if (!match || parseInt(match[1], 10) === 0) {
      console.log("当選件数は0件です。");
      return [];
    }

    // NOTE: 1ページに表示される最大の件数は 10 件であるため、
    // 当選件数が 10 件を超える場合は、次のページに遷移して取得する必要がある。
    // 基本 1,2 件しか当選しないので、ひとまず 1ページで取得する。
    const reservationItems = await page
      .getByRole("listitem")
      .filter({ hasText: filterText })
      .all();

    await Promise.all(
      reservationItems.map(async (item) => {
        const date = await item
          .locator("time")
          .first()
          .textContent({ timeout: TIMEOUT.ELEMENT_ACTION })
          .catch(() => null);
        const time = await item
          .locator(".is-time")
          .textContent({ timeout: TIMEOUT.ELEMENT_ACTION })
          .catch(() => null);
        const facilityName = await item
          .getByRole("link")
          .textContent({ timeout: TIMEOUT.ELEMENT_ACTION })
          .catch(() => null);
        const statusText = RESERVATION_STATUS_MAP[filterText];

        reservations.push({
          date: normalize(date),
          time: normalize(time),
          facilityName: normalize(facilityName)
            .replace(/^場所：\s*/, "")
            .replace(/\s*\/\s*/g, "/"),
          status: statusText,
        });
      }),
    );

    console.log("reservations", reservations);

    return reservations;
  } catch (error) {
    console.error("予約情報の取得に失敗しました:", error);
    return [];
  } finally {
    await browser.close();
  }
}
