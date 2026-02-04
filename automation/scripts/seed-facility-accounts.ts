/**
 * facility_accounts テーブルに一括でデータを投入するスクリプト
 *
 * 実行: cd automation && npm run seed:accounts
 */

import { createClient } from "@supabase/supabase-js";

import type { Account } from "~/types";
import { loadAccountsFromSheet } from "~/utils/config";
import { encryptPassword } from "~/utils/encryption";

// 環境変数
const GOOGLE_SHEETS_ID = process.env.GOOGLE_SHEETS_ID;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_SHEETS_NAME = process.env.GOOGLE_SHEETS_NAME;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

async function main() {
  console.log("Starting facility accounts seeder...");

  // 環境変数チェック
  if (!GOOGLE_SHEETS_ID || !GOOGLE_API_KEY) {
    console.error(
      "Required environment variables: GOOGLE_SHEETS_ID, GOOGLE_API_KEY",
    );
    process.exit(1);
  }
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
    console.error(
      "Required environment variables: SUPABASE_URL, SUPABASE_SECRET_KEY",
    );
    process.exit(1);
  }
  if (!ENCRYPTION_KEY) {
    console.error("Required environment variables: ENCRYPTION_KEY");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

  // admin profile を取得
  const { data: adminProfile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, roles!inner(code)")
    .eq("roles.code", "admin")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (profileError) {
    console.error(`Failed to fetch admin profile: ${profileError.message}`);
    process.exit(1);
  }
  if (!adminProfile) {
    console.error(
      "Admin profile not found. Please create an admin user first.",
    );
    process.exit(1);
  }
  console.log(`Found admin profile: ${adminProfile.full_name}`);

  // Google Sheets からアカウント取得
  const config = await loadAccountsFromSheet(
    GOOGLE_SHEETS_ID,
    GOOGLE_API_KEY,
    GOOGLE_SHEETS_NAME,
  );
  console.log(`Loaded ${config.accounts.length} accounts from Google Sheets`);

  // 既存アカウントを取得（重複スキップ用）
  const { data: existingAccounts } = await supabase
    .from("facility_accounts")
    .select("user_id")
    .eq("profile_id", adminProfile.id);

  const existingUserIds = new Set(
    existingAccounts?.map((a) => a.user_id) ?? [],
  );
  const newAccounts = config.accounts.filter(
    (a) => !existingUserIds.has(a.userId),
  );

  if (existingUserIds.size > 0) {
    console.log(`Skipping ${existingUserIds.size} existing accounts`);
  }

  if (newAccounts.length === 0) {
    console.log("No new accounts to insert");
    return;
  }

  // 一括登録
  console.log(`Inserting ${newAccounts.length} accounts...`);

  const successAccounts: Account[] = [];

  for (const account of newAccounts) {
    try {
      const encryptedPassword = await encryptPassword(
        account.password,
        ENCRYPTION_KEY,
      );
      const { error } = await supabase.from("facility_accounts").insert({
        profile_id: adminProfile.id,
        user_id: account.userId,
        encrypted_password: encryptedPassword,
        circle_name: account.circleName ?? null,
        representative_name: account.representativeName ?? null,
      });
      if (error) {
        console.error(`  ${account.userId}: ${error.message}`);
        continue;
      }
      successAccounts.push(account);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      console.error(`  ${account.userId}: ${message}`);
      continue;
    }
  }

  console.log(`\n✅ Completed: ${successAccounts.length} success`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
