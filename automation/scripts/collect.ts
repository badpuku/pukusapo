import { fetchReservations } from '~playwright/collector'
import { loadAccountsFromSheet } from '~/utils/config'
import type { AccountConfig, ReservationResult } from '~/types'

// 環境変数
const API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8787'
const GOOGLE_SHEETS_ID = process.env.GOOGLE_SHEETS_ID
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY
const GOOGLE_SHEETS_NAME = process.env.GOOGLE_SHEETS_NAME

async function main() {
  console.log("Starting reservation collector...");

  // 環境変数チェック
  if (!GOOGLE_SHEETS_ID || !GOOGLE_API_KEY) {
    console.error('Required environment variables: GOOGLE_SHEETS_ID, GOOGLE_API_KEY')
    process.exit(1)
  }

  // アカウント設定読み込み（Google Sheets から）
  let config: AccountConfig
  try {
    config = await loadAccountsFromSheet(GOOGLE_SHEETS_ID, GOOGLE_API_KEY, GOOGLE_SHEETS_NAME)
    console.log(`Loaded accounts from Google Sheets`)
  } catch (error) {
    console.error(`Failed to load accounts from Google Sheets: ${error}`)
    process.exit(1)
  }

  // 予約情報を取得（順次実行）
  const allReservations = await config.accounts.reduce(
    async (accPromise, account) => {
      const acc = await accPromise
      const reservations = await fetchReservations(account)
      return [...acc, { accountId: account.userId, reservations }]
    },
    Promise.resolve<ReservationResult[]>([])
  )

  // 予約情報をAPIへ送信
  console.log(`Sending reservations to ${API_ENDPOINT}/reservations...`)
  try {
    const response = await fetch(`${API_ENDPOINT}/reservations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reservations: allReservations })
    })

    if (response.ok) {
      console.log('✅ Reservations sent successfully')
    } else {
      console.error(`❌ Failed to send reservations: ${response.status} ${response.statusText}`)
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Failed to send reservations:', error)
    process.exit(1)
  }

  console.log('\n🎉 Collector finished successfully')
}

// メイン処理実行
main().catch((error) => {
  console.error('💥 Fatal error:', error)
  process.exit(1)
})
