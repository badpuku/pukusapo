import type { AccountConfig } from "~/types";
import { fetchAccountsFromSheet } from "~/utils/sheets";

/**
 * Google Sheets からアカウント情報を読み込む
 */
export async function loadAccountsFromSheet(
  spreadsheetId: string,
  apiKey: string,
  sheetName?: string,
): Promise<AccountConfig> {
  const accounts = await fetchAccountsFromSheet(
    spreadsheetId,
    apiKey,
    sheetName,
  );
  return { accounts };
}
