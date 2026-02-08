import type { ReservationResult } from "~/types";
import { fetchAccountsFromApi } from "~/utils/config";
import { fetchReservations } from "~playwright/collector";

// 環境変数
const API_URL = process.env.FRONTEND_API_URL || "http://localhost:3000";
const API_ENDPOINT = API_URL;

async function main() {
  console.log("Starting reservation collector...");

  const accounts = await fetchAccountsFromApi();
  if(accounts.length === 0) {
    console.error("No accounts found");
    process.exit(1);
  }

  // 予約情報を取得（順次実行）
  const allReservations = await accounts.reduce(
    async (accPromise, account) => {
      const acc = await accPromise;
      const reservations = await fetchReservations(account);
      return [...acc, { accountId: account.userId, reservations }];
    },
    Promise.resolve<ReservationResult[]>([]),
  );

  // 予約情報をAPIへ送信
  console.log(`Sending reservations to ${API_ENDPOINT}/reservations...`);
  try {
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
  }

  console.log("\n🎉 Collector finished successfully");
}

// メイン処理実行
main().catch((error) => {
  console.error("💥 Fatal error:", error);
  process.exit(1);
});
