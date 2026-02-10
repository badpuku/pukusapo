import {
  type FacilityAccount,
  FacilityAccountApiListResponseSchema,
  type FacilityAccountSeed,
} from "~/types";
import { decryptPassword } from "~/utils/encryption";
import { fetchAccountsFromSheet } from "~/utils/sheets";

/**
 * Google Sheets からアカウント情報を読み込む
 */
export async function loadAccountsFromSheet(
  spreadsheetId: string,
  apiKey: string,
  sheetName?: string,
): Promise<FacilityAccountSeed[]> {
  const accounts = await fetchAccountsFromSheet(
    spreadsheetId,
    apiKey,
    sheetName,
  );
  return accounts;
}

export async function fetchAccountsFromApi(): Promise<FacilityAccount[]> {
  const apiUrl = process.env.FRONTEND_API_URL;
  if (!apiUrl) {
    throw new Error("FRONTEND_API_URL is not set");
  }
  const apiKey = process.env.AUTOMATION_API_KEY;
  if (!apiKey) {
    throw new Error("AUTOMATION_API_KEY is not set");
  }
  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error("ENCRYPTION_KEY is not set");
  }

  const response = await fetch(`${apiUrl}/api/facility/accounts`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch accounts from API");
  }
  const parsed = FacilityAccountApiListResponseSchema.safeParse(
    await response.json(),
  );
  if (!parsed.success) {
    throw new Error("Failed to parse accounts from API");
  }

  // snake_case → camelCase + encrypted_password を復号
  const accounts: FacilityAccount[] = await Promise.all(
    parsed.data.data.map(async (item) => ({
      id: item.id,
      userId: item.user_id,
      password: await decryptPassword(item.encrypted_password, encryptionKey),
      circleName: item.circle_name,
      representativeName: item.representative_name,
    })),
  );

  return accounts;
}
