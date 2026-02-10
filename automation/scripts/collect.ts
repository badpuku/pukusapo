import type { FacilityAccount, ReservationResult } from "~/types";
import { fetchAccountsFromApi } from "~/utils/config";
import { fetchReservations } from "~playwright/collector";
import { ServerError } from "~playwright/collector/errors";

// 環境変数
const API_URL = process.env.FRONTEND_API_URL || "http://localhost:3000";
const API_ENDPOINT = API_URL;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** ランダムな整数を返す (min 以上 max 以下) */
const randomBetween = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// --- レート制限・リトライ設定 ---
const RATE_LIMIT = {
  /** アカウント間の通常待機 (ms) */
  BETWEEN_ACCOUNTS_MIN: 5_000,
  BETWEEN_ACCOUNTS_MAX: 15_000,
  /** サーバーエラー時のクールダウン基準値 (ms) — 2 分 */
  COOLDOWN_BASE: 2 * 60 * 1_000,
  /** クールダウン上限 (ms) — 5 分 */
  COOLDOWN_MAX: 5 * 60 * 1_000,
  /** 同一アカウントの最大リトライ回数 */
  MAX_RETRIES: 3,
  /** エラー復帰後、成功するたびにクールダウンをこの分だけ減らす (ms) */
  COOLDOWN_DECAY: 30_000,
} as const;

/** 1 アカウント分の取得をリトライ付きで実行する */
const fetchWithRetry = async (
  account: FacilityAccount,
  cooldown: number,
  attempt = 1,
): Promise<{ result: ReservationResult; cooldown: number }> => {
  try {
    const reservations = await fetchReservations(account);
    return {
      result: { accountId: account.userId, reservations },
      cooldown: Math.max(cooldown - RATE_LIMIT.COOLDOWN_DECAY, 0),
    };
  } catch (error) {
    if (!(error instanceof ServerError) || attempt >= RATE_LIMIT.MAX_RETRIES) {
      if (error instanceof ServerError) {
        console.log(
          `アカウント ${account.userId}: 最大リトライ回数 (${RATE_LIMIT.MAX_RETRIES}) に到達、スキップします。`,
        );
      } else {
        console.error(
          `アカウント ${account.userId}: 予期しないエラー:`,
          error,
        );
      }
      return {
        result: { accountId: account.userId, reservations: [] },
        cooldown,
      };
    }

    const backoff = Math.min(
      RATE_LIMIT.COOLDOWN_BASE * Math.pow(1.5, attempt - 1),
      RATE_LIMIT.COOLDOWN_MAX,
    );
    console.log(
      `アカウント ${account.userId}: サーバーエラー (${error.statusCode}) を検知。` +
        `${Math.round(backoff / 1000)} 秒待機後にリトライ (${attempt}/${RATE_LIMIT.MAX_RETRIES})...`,
    );
    await wait(backoff);

    return fetchWithRetry(account, backoff, attempt + 1);
  }
};

/** アカウントリストを順次処理し、クールダウンを持ち越す */
const processAccounts = async (
  remaining: FacilityAccount[],
  results: ReservationResult[] = [],
  cooldown = 0,
): Promise<ReservationResult[]> => {
  if (remaining.length === 0) return results;

  const [account, ...rest] = remaining;

  // 2 件目以降はアカウント間の待機を入れる
  if (results.length > 0) {
    const baseDelay = randomBetween(
      RATE_LIMIT.BETWEEN_ACCOUNTS_MIN,
      RATE_LIMIT.BETWEEN_ACCOUNTS_MAX,
    );
    const totalDelay = baseDelay + cooldown;
    console.log(
      `次のアカウントまで ${Math.round(totalDelay / 1000)} 秒待機...`,
    );
    await wait(totalDelay);
  }

  const { result, cooldown: nextCooldown } = await fetchWithRetry(
    account,
    cooldown,
  );

  return processAccounts(rest, [...results, result], nextCooldown);
};

async function main() {
  console.log("Starting reservation collector...");

  const accounts = await fetchAccountsFromApi();
  if (accounts.length === 0) {
    console.error("No accounts found");
    process.exit(1);
  }

  const allReservations = await processAccounts(accounts);

  console.log(allReservations);

  // 予約情報をAPIへ送信
  console.log(`Sending reservations to ${API_ENDPOINT}/reservations...`);
  /* try {
    const response = await fetch(`${API_ENDPOINT}/reservations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reservations: allReservations }),
    });

    if (response.ok) {
      console.log("✅ Reservations sent successfully");
    } else {
      console.error(
        `❌ Failed to send reservations: ${response.status} ${response.statusText}`,
      );
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Failed to send reservations:", error);
    process.exit(1);
  } */

  console.log("\n🎉 Collector finished successfully");
}

// メイン処理実行
main().catch((error) => {
  console.error("💥 Fatal error:", error);
  process.exit(1);
});
