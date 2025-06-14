import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "~/db/schema";

export type DatabaseClient = ReturnType<typeof createDatabaseClient>;

export const createDatabaseClient = (env: { SUPABASE_URL: string }) => {
  const client = postgres(env.SUPABASE_URL, {
    prepare: false,
    max: 10, // 最大接続数
    idle_timeout: 20, // アイドルタイムアウト（秒）
    connect_timeout: 10, // 接続タイムアウト（秒）
  });

  return drizzle(client, { schema });
};

// レガシーサポート（既存コードとの互換性のため）
export const db = createDatabaseClient;
