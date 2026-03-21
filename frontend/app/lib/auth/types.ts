import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "~/models/supabase";
import type { ProfileResponse } from "~/services/profiles/schemas";

/**
 * 認証のみ確認済み（プロフィール未取得）のコンテキスト
 * プロフィール取得が不要な軽量サービスで使用
 */
export interface BaseAuthContext {
  // Clerk から取得した userId
  userId: string;
  supabase: SupabaseClient<Database>;
  env: Cloudflare.Env;
  token: string;
}

/**
 * 認証確認済み + プロフィール取得済みのコンテキスト
 * 権限チェックが必要なサービスで使用
 */
export interface AuthContext extends BaseAuthContext {
  // プロフィール情報（権限レベルを含む）
  profile: ProfileResponse;
}

/**
 * APIキー認証のコンテキスト
 */
export interface ApiKeyAuthContext {
  supabase: SupabaseClient<Database>;
  env: Cloudflare.Env;
}