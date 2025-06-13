import { and, eq, isNotNull, isNull, like, type SQL } from "drizzle-orm";

import type { DatabaseClient } from "~/db/client";
import { type NewProfile, profiles } from "~/db/schema/profiles";

// === 基本的なクエリビルダー関数 ===

// データベース操作の基本的な高階関数
const withDatabase =
  <T extends unknown[], R>(operation: (db: DatabaseClient, ...args: T) => R) =>
  (db: DatabaseClient) =>
  (...args: T): R =>
    operation(db, ...args);

// === CREATE 操作 ===
const insertProfile = withDatabase((db: DatabaseClient, data: NewProfile) =>
  db.insert(profiles).values(data).returning(),
);

const insertProfiles = withDatabase((db: DatabaseClient, data: NewProfile[]) =>
  db.insert(profiles).values(data).returning(),
);

// === READ 操作 ===
const selectAllProfiles = withDatabase((db: DatabaseClient) =>
  db.select().from(profiles),
);

const selectProfileByUserId = withDatabase(
  (db: DatabaseClient, userId: string) =>
    db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1),
);

const selectProfileByEmail = withDatabase((db: DatabaseClient, email: string) =>
  db.select().from(profiles).where(eq(profiles.email, email)).limit(1),
);

// === UPDATE 操作 ===
const updateProfileByUserId = withDatabase(
  (db: DatabaseClient, userId: string, data: Partial<NewProfile>) =>
    db
      .update(profiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(profiles.userId, userId))
      .returning(),
);

// === DELETE 操作 ===
const deleteProfileByUserId = withDatabase(
  (db: DatabaseClient, userId: string) =>
    db.delete(profiles).where(eq(profiles.userId, userId)),
);

// === 高度な関数合成 ===

// 結果変換用の高階関数
const transformResult =
  <T, R>(transform: (data: T) => R) =>
  (promise: Promise<T>): Promise<R> =>
    promise.then(transform);

// 最初の結果を取得する変換関数
const getFirst = <T>(results: T[]): T | null => results[0] || null;

// エラーハンドリング付きの実行
const withErrorHandling =
  <T>(
    operation: () => Promise<T>,
    errorMessage: string = "Database operation failed",
  ) =>
  async (): Promise<T | null> => {
    try {
      return await operation();
    } catch (error) {
      console.error(errorMessage, error);
      return null;
    }
  };

// === 実用的な組み合わせ関数 ===

// プロファイル作成（エラーハンドリング付き）
export const createProfile = (db: DatabaseClient) => (data: NewProfile) =>
  withErrorHandling(() => insertProfile(db)(data), "Failed to create profile");

// ユーザーIDでプロファイル取得（単一結果）
export const getProfileByUserId = (db: DatabaseClient) => (userId: string) =>
  transformResult(getFirst)(selectProfileByUserId(db)(userId));

// メールでプロファイル取得（単一結果）
export const getProfileByEmail = (db: DatabaseClient) => (email: string) =>
  transformResult(getFirst)(selectProfileByEmail(db)(email));

// プロファイル更新（存在チェック付き）
export const updateProfile =
  (db: DatabaseClient) => async (userId: string, data: Partial<NewProfile>) => {
    const existing = await getProfileByUserId(db)(userId);
    if (!existing) {
      throw new Error(`Profile not found for userId: ${userId}`);
    }
    return updateProfileByUserId(db)(userId, data);
  };

// プロファイル削除（存在チェック付き）
export const deleteProfile = (db: DatabaseClient) => async (userId: string) => {
  const existing = await getProfileByUserId(db)(userId);
  if (!existing) {
    throw new Error(`Profile not found for userId: ${userId}`);
  }
  return deleteProfileByUserId(db)(userId);
};

// === 検索とフィルタリング ===

// 名前で検索
export const searchProfilesByName =
  (db: DatabaseClient) => (namePattern: string) =>
    db
      .select()
      .from(profiles)
      .where(like(profiles.name, `%${namePattern}%`));

// 複数条件での検索
export const searchProfiles =
  (db: DatabaseClient) =>
  (filters: { name?: string; email?: string; userId?: string }) => {
    const conditions: SQL[] = [];

    if (filters.name) conditions.push(like(profiles.name, `%${filters.name}%`));
    if (filters.email) conditions.push(eq(profiles.email, filters.email));
    if (filters.userId) conditions.push(eq(profiles.userId, filters.userId));

    return conditions.length > 0
      ? db
          .select()
          .from(profiles)
          .where(and(...conditions))
      : db.select().from(profiles);
  };

// === バッチ操作 ===

// 複数プロファイル作成
export const createProfiles = (db: DatabaseClient) => (data: NewProfile[]) =>
  insertProfiles(db)(data);

// プロファイル一括更新（条件付き）
export const updateProfilesWhere =
  (db: DatabaseClient) => (condition: SQL, data: Partial<NewProfile>) =>
    db
      .update(profiles)
      .set({ ...data, updatedAt: new Date() })
      .where(condition)
      .returning();

// === 統計・集計関数 ===
export const getProfileStats = (db: DatabaseClient) => () => ({
  total: db.select({ count: profiles.id }).from(profiles),
  withEmail: db
    .select({ count: profiles.id })
    .from(profiles)
    .where(isNotNull(profiles.email)),
  withoutEmail: db
    .select({ count: profiles.id })
    .from(profiles)
    .where(isNull(profiles.email)),
});

// === エクスポート（従来のAPIとの互換性） ===
export const ProfileQueries = {
  create: createProfile,
  getByUserId: getProfileByUserId,
  getByEmail: getProfileByEmail,
  update: updateProfile,
  delete: deleteProfile,
  search: searchProfiles,
  searchByName: searchProfilesByName,
  getAll: selectAllProfiles,
  createMultiple: createProfiles,
  getStats: getProfileStats,
};
