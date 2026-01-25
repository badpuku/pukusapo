# Drizzle ORM から Supabase CLI + Zod への移行計画

## 1. 現状分析（完了）

### 現在のアーキテクチャ
- **ORM**: Drizzle ORM v0.40.0
- **データベース**: Supabase（PostgreSQL）
- **認証**: Clerk
- **型生成**: Drizzle $inferSelect/$inferInsert
- **マイグレーション**: Drizzle Kit + Supabase CLI

### 影響範囲
- データベースクライアント: `app/db/client.ts`, `app/db/client.server.ts`
- スキーマ定義: `app/db/schema/` 配下のすべてのファイル
- クエリ層: `app/db/queries/` 配下のすべてのファイル
- マイグレーション: `supabase/migrations/` 配下のファイル
- シード: `app/db/seed.ts`

## 2. 新アーキテクチャ設計

### 技術スタック
- **データベースアクセス**: Supabase JavaScript Client
- **スキーマ定義・バリデーション**: Zod
- **型生成**: Supabase CLI（`supabase gen types`）
- **マイグレーション**: Supabase CLI ネイティブ
- **クエリビルダー**: Supabase PostgREST API

### ディレクトリ構造（提案）
```
app/
├── models/                    # Zodスキーマ（データモデル定義）
│   ├── profiles.ts           # プロファイルスキーマ
│   ├── roles.ts              # ロールスキーマ
│   ├── forms.ts              # フォームスキーマ
│   └── index.ts              # スキーマエクスポート
├── services/                  # 外部サービス統合
│   ├── supabase/             # Supabase関連
│   │   ├── client.ts         # Supabaseクライアント初期化
│   │   ├── server.ts         # サーバーサイドクライアント
│   │   ├── types.ts          # 生成された型定義
│   │   └── api/              # APIレイヤー
│   │       ├── profiles.ts   # プロファイルAPI
│   │       ├── roles.ts      # ロールAPI
│   │       └── forms.ts      # フォームAPI
│   └── clerk/                # Clerk認証（既存）
supabase/
├── migrations/                # SQLマイグレーション
├── functions/                 # Edge Functions
└── seed.sql                  # シードデータ
```

## 3. Zodスキーマ設計戦略

### 基本方針
1. **バリデーション層の統一**: フロントエンド・バックエンド共通のバリデーション
2. **型推論の活用**: Zodから型を自動生成
3. **Supabase型との統合**: 生成された型とZodスキーマの連携

### 実装パターン例
```typescript
// app/models/profiles.ts
import { z } from 'zod';
import type { Database } from '../services/supabase/types';

// 基本スキーマ
export const ProfileSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  roleId: z.number(),
  username: z.string().nullable(),
  fullName: z.string().nullable(),
  avatarUrl: z.string().url().nullable(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// 作成用スキーマ
export const CreateProfileSchema = ProfileSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// 更新用スキーマ
export const UpdateProfileSchema = CreateProfileSchema.partial();

// 型定義
export type Profile = z.infer<typeof ProfileSchema>;
export type CreateProfile = z.infer<typeof CreateProfileSchema>;
export type UpdateProfile = z.infer<typeof UpdateProfileSchema>;
```

## 4. データベースクライアント再実装

### Supabaseクライアント設計
```typescript
// app/services/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

export const createSupabaseClient = (env: {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}) => {
  return createClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
      },
      global: {
        headers: {
          'x-application-name': 'pukusapo',
        },
      },
    }
  );
};
```

### サーバーサイドクライアント
```typescript
// app/services/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import type { Database } from './types';

export const createSupabaseServerClient = (
  request: Request,
  env: { SUPABASE_URL: string; SUPABASE_ANON_KEY: string }
) => {
  const headers = new Headers();
  
  return createServerClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return request.headers.get('Cookie')?.match(
            new RegExp(`${name}=([^;]+)`)
          )?.[1];
        },
        set(name: string, value: string, options: any) {
          headers.append('Set-Cookie', `${name}=${value}`);
        },
        remove(name: string, options: any) {
          headers.append('Set-Cookie', `${name}=; Max-Age=0`);
        },
      },
    }
  );
};
```

## 5. クエリ・ミューテーション移行

### 現在のDrizzleクエリ
```typescript
// Before
export const getProfileWithRoleByUserId = (db: DatabaseClient) => (userId: string) => {
  return db
    .select({ profile: profiles, role: roles })
    .from(profiles)
    .innerJoin(roles, eq(profiles.roleId, roles.id))
    .where(eq(profiles.userId, userId))
    .limit(1);
};
```

### Supabase版への移行
```typescript
// After: app/services/supabase/api/profiles.ts
import { ProfileWithRoleSchema } from '../../../models/profiles';

export const getProfileWithRoleByUserId = async (
  supabase: SupabaseClient,
  userId: string
) => {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      role:roles(*)
    `)
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  
  // Zodバリデーション
  const validated = ProfileWithRoleSchema.parse(data);
  return validated;
};
```

## 6. 型生成戦略

### Supabase CLI による型生成
```bash
# package.json scripts
{
  "db:types": "supabase gen types typescript --local > app/services/supabase/types.ts",
  "db:types:remote": "supabase gen types typescript --project-ref $PROJECT_REF > app/services/supabase/types.ts"
}
```

### 生成された型とZodの統合
```typescript
// app/lib/schemas/utils.ts
import type { Database } from '../supabase/types';

// Supabase型からZodスキーマを作成するユーティリティ
export type Tables = Database['public']['Tables'];
export type ProfileRow = Tables['profiles']['Row'];
export type ProfileInsert = Tables['profiles']['Insert'];
export type ProfileUpdate = Tables['profiles']['Update'];

// Zodスキーマと生成型の整合性チェック
export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  return schema.parse(data);
}
```

## 7. マイグレーション管理

### Supabase CLI ネイティブ管理
```bash
# 新規マイグレーション作成
supabase migration new create_forms_table

# マイグレーション適用
supabase migration up

# ロールバック
supabase migration repair --status applied
```

### マイグレーションファイル管理
- `supabase/migrations/`: タイムスタンプ付きSQLファイル
- バージョン管理: Gitで管理
- 環境別適用: ローカル、開発、本番

## 8. テスト戦略

### 単体テスト
```typescript
// app/lib/api/__tests__/profiles.test.ts
import { describe, it, expect } from 'vitest';
import { CreateProfileSchema } from '../schemas/profiles';

describe('Profile Schema Validation', () => {
  it('should validate correct profile data', () => {
    const data = {
      userId: 'user_123',
      roleId: 1,
      username: 'testuser',
      isActive: true,
    };
    
    const result = CreateProfileSchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});
```

### 統合テスト
```typescript
// Supabase Test Helpers
import { createClient } from '@supabase/supabase-js';

const testClient = createClient(
  process.env.SUPABASE_TEST_URL!,
  process.env.SUPABASE_TEST_ANON_KEY!
);
```

## 9. 段階的移行ロードマップ

### Phase 1: 準備（1週間）
- [ ] Zodのインストールと基本設定
- [ ] Supabase CLIの設定最適化
- [ ] 型生成パイプラインの構築
- [ ] 開発環境の整備

### Phase 2: スキーマ移行（2週間）
- [ ] Zodスキーマの作成（既存Drizzleスキーマから）
- [ ] バリデーションロジックの実装
- [ ] 型定義の統合テスト

### Phase 3: クライアント移行（1週間）
- [ ] Supabaseクライアントの実装
- [ ] 認証統合（Clerk + Supabase）
- [ ] エラーハンドリングの実装

### Phase 4: クエリ層移行（2週間）
- [ ] 既存クエリのSupabase版作成
- [ ] パフォーマンステスト
- [ ] 並行稼働テスト

### Phase 5: 切り替え（1週間）
- [ ] 機能フラグによる段階的切り替え
- [ ] モニタリングとロールバック準備
- [ ] 本番環境への展開

### Phase 6: クリーンアップ（1週間）
- [ ] Drizzle関連コードの削除
- [ ] パッケージの整理
- [ ] ドキュメント更新

## 10. リスクと対策

### リスク
1. **型安全性の低下**: Drizzleの強力な型推論を失う
2. **パフォーマンス影響**: PostgREST APIのオーバーヘッド
3. **移行中の不整合**: 並行稼働時のデータ不整合

### 対策
1. **Zodによる実行時検証**: 型安全性を実行時に保証
2. **キャッシング戦略**: React Routerのローダーキャッシュ活用
3. **機能フラグ**: 段階的な切り替えとロールバック可能性

## 11. メリット

### 開発効率
- Supabaseエコシステムとの完全な統合
- リアルタイム機能への容易なアクセス
- Edge Functionsとの連携強化

### 保守性
- Supabase CLIによる統一的な管理
- SQLマイグレーションの直接管理
- Zodによる明示的なバリデーション

### スケーラビリティ
- PostgREST APIの最適化
- RLSポリシーとの完全統合
- Supabaseのインフラ最適化

## 12. 次のステップ

1. **承認取得**: チームでの計画レビューと承認
2. **POC実装**: 小規模機能での検証
3. **パフォーマンステスト**: 移行前後の比較
4. **段階的実装**: ロードマップに従った実装

## 付録: 参考リソース

- [Supabase JavaScript Client Docs](https://supabase.com/docs/reference/javascript)
- [Zod Documentation](https://zod.dev)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [PostgREST API Guide](https://postgrest.org)