import { z } from "zod";

import type { FacilityAccountSeed } from "~/types";

const userIdRegex = /^\d{8}$/;
const passwordRegex = /^[a-zA-Z0-9]+$/;

const isValidAccountRow = (row: string[]): boolean => {
  if (!row[0] || !row[4]) return false;
  if (!userIdRegex.test(row[0])) {
    console.warn(`Invalid userId: ${row[0]}`);
    return false;
  }
  if (!passwordRegex.test(row[4])) {
    console.warn(`Invalid password format for userId: ${row[0]}`);
    return false;
  }
  return true;
};

const SheetsApiResponseSchema = z.object({
  range: z.string(),
  majorDimension: z.string(),
  values: z.array(z.array(z.string())),
});

/**
 * Google Sheets API からアカウント情報を取得
 * @param spreadsheetId スプレッドシートID
 * @param apiKey Google API キー
 * @param sheetName シート名（省略時は最初のシート）
 */
export async function fetchAccountsFromSheet(
  spreadsheetId: string,
  apiKey: string,
  sheetName?: string,
): Promise<FacilityAccountSeed[]> {
  const range = sheetName ? `${sheetName}!A2:E` : "A2:E";
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?key=${apiKey}`;
  const response = await fetch(url);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Google Sheets API error: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }

  const json = await response.json();
  const data = SheetsApiResponseSchema.safeParse(json);

  if (!data.success) {
    throw new Error(`Google Sheets API error: ${data.error.message}`);
  }

  const rows = data.data.values ?? [];

  const accounts: FacilityAccountSeed[] = rows.filter(isValidAccountRow).map((row) => ({
    userId: row[0],
    circleName: row[1],
    representativeName: row[2],
    password: row[4],
  }));

  return accounts;
}
