# ユーザーロール機能実装計画書

## 1. 概要

現在のアプリケーションにユーザーロール機能を追加し、admin画面への権限制御を実装する。

### 目的

- ユーザーに役割（role）を付与する機能を追加
- admin画面へのアクセス権限を制御
- 将来的な権限管理の拡張性を確保

### 現在の構成

- 認証: Clerk
- データベース: Supabase + Drizzle ORM
- フロントエンド: React Router v7
- 既存のadmin layout: `app/components/layouts/adminLayout/`

## 2. データベース設計

### 2.1 設計アプローチの検討

**アプローチA: 単一カラム方式（シンプル）**

- `profiles`テーブルに`role`カラムを直接追加
- 値は文字列（'user', 'admin', 'moderator'）

**アプローチB: 正規化方式（推奨）**

- `roles`テーブルを別途作成
- `profiles`テーブルに`role_code`（外部キー）を追加
- より拡張性が高く、管理しやすい

### 2.2 採用案：正規化方式

**理由**：

- 役割の追加・変更が容易
- 役割の表示名、説明、権限レベル等の追加情報を管理可能
- データの整合性が保たれる
- 将来的な機能拡張に対応しやすい

**設計検討**: Primary Key の選択

**オプションA: `code`をPrimary Key（現在案）**

- 利点: シンプル、直感的
- 欠点: code変更時の複雑さ、パフォーマンス

**オプションB: `id` + `code`構成（推奨）**

- 利点: code変更可能、パフォーマンス、将来性
- 欠点: 若干の複雑さ

```sql
-- rolesテーブルの作成（改善版）
CREATE TABLE public.roles (
  id bigserial PRIMARY KEY,
  code varchar(20) NOT NULL UNIQUE, -- 変更可能なコード
  name varchar(50) NOT NULL,
  description text,
  level integer NOT NULL DEFAULT 0, -- 権限レベル（数値が大きいほど高権限）
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- codeにユニークインデックス（検索パフォーマンス向上）
CREATE INDEX idx_roles_code ON public.roles(code) WHERE is_active = true;

-- 初期データの挿入
INSERT INTO public.roles (code, name, description, level) VALUES
('user', '一般ユーザー', '基本的な機能を利用できます', 1),
('moderator', 'モデレーター', '一部の管理機能を利用できます', 5),
('admin', '管理者', 'すべての管理機能を利用できます', 10);

-- profilesテーブルにrole_idカラムを追加
ALTER TABLE public.profiles
ADD COLUMN role_id bigint;

-- デフォルト値設定（userロールのIDを設定）
UPDATE public.profiles
SET role_id = (SELECT id FROM public.roles WHERE code = 'user');

-- NOT NULL制約追加
ALTER TABLE public.profiles
ALTER COLUMN role_id SET NOT NULL;

-- 外部キー制約を追加
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_id_fkey
FOREIGN KEY (role_id) REFERENCES public.roles(id);

-- インデックス追加
CREATE INDEX idx_profiles_role_id ON public.profiles(role_id);

-- updated_at自動更新トリガー（rolesテーブル用）
CREATE TRIGGER handle_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

### 2.3 Drizzleスキーマの更新

`app/db/schema/roles.ts`を新規作成：

```typescript
import {
  pgTable,
  bigserial,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

/**
 * ユーザーロール定義
 */
export const roles = pgTable("roles", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 50 }).notNull(),
  description: text("description"),
  level: integer("level").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}).enableRLS();

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
export type UserRoleCode = "user" | "admin" | "moderator";
```

`app/db/schema/profiles.ts`を更新：

```typescript
import { pgTable, text, timestamp, uuid, bigint } from "drizzle-orm/pg-core";
import { roles } from "./roles";

/**
 * ユーザープロファイル情報
 */
export const profiles = pgTable("profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().unique(),
  name: varchar("name", { length: 100 }),
  roleId: bigint("role_id", { mode: "number" })
    .notNull()
    .references(() => roles.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}).enableRLS();

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
```

### 2.4 RLSポリシーの更新

権限管理のためのRLSポリシーを追加：

```sql
-- rolesテーブルのRLSポリシー
-- 全ユーザーがroles情報を閲覧可能（権限チェックに必要）
CREATE POLICY "Everyone can view active roles"
ON public.roles
FOR SELECT
USING (is_active = true);

-- 管理者のみがroles情報を更新可能
CREATE POLICY "Admins can manage roles"
ON public.roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.user_id = auth.uid()::text AND r.code = 'admin'
  )
);

-- profilesテーブルのRLSポリシー
-- 管理者が全ユーザーの情報を閲覧できるポリシー
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.user_id = auth.uid()::text AND r.code = 'admin'
  )
);

-- 管理者が他ユーザーのrole_idを更新できるポリシー
CREATE POLICY "Admins can update user roles"
ON public.profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.user_id = auth.uid()::text AND r.code = 'admin'
  )
);
```

## 3. 権限制御の実装

### 3.1 権限チェック用ユーティリティ

`app/utils/auth.ts`を作成：

```typescript
import { createServerSupabaseClient } from "~/services/supabase.server";
import type { AppLoadContext } from "react-router";

export type UserRoleCode = "user" | "admin" | "moderator";

export async function getCurrentUserProfile(
  request: Request,
  context: AppLoadContext,
) {
  const supabase = createServerSupabaseClient(request, context);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      `
      *,
      role:roles!inner(*)
    `,
    )
    .eq("user_id", user.id)
    .single();

  return profile;
}

export async function requireRole(
  request: Request,
  context: AppLoadContext,
  requiredRole: UserRoleCode | UserRoleCode[],
) {
  const profile = await getCurrentUserProfile(request, context);

  if (!profile || !profile.role) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

  if (!roles.includes(profile.role.code as UserRoleCode)) {
    throw new Response("Forbidden", { status: 403 });
  }

  return profile;
}

export async function requireRoleLevel(
  request: Request,
  context: AppLoadContext,
  requiredLevel: number,
) {
  const profile = await getCurrentUserProfile(request, context);

  if (!profile || !profile.role) {
    throw new Response("Unauthorized", { status: 401 });
  }

  if (profile.role.level < requiredLevel) {
    throw new Response("Forbidden", { status: 403 });
  }

  return profile;
}

export function hasRole(
  userRoleCode: string,
  requiredRole: UserRoleCode | UserRoleCode[],
): boolean {
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  return roles.includes(userRoleCode as UserRoleCode);
}

export function hasRoleLevel(
  userRoleLevel: number,
  requiredLevel: number,
): boolean {
  return userRoleLevel >= requiredLevel;
}
```

### 3.2 Admin Layout用権限チェック

`app/routes/_admin-layout/route.tsx`を更新：

```typescript
import { type LoaderFunctionArgs } from "react-router";
import { Outlet } from "react-router";
import { AdminLayout } from "~/components/layouts/adminLayout/adminLayout";
import { requireRole } from "~/utils/auth";

export const loader = async ({ context, request }: LoaderFunctionArgs) => {
  // admin権限を要求
  const profile = await requireRole(request, context, 'admin');

  return {
    user: profile,
  };
};

export default function AdminRoute() {
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}
```

### 3.3 クライアントサイド権限制御

`app/hooks/useAuth.ts`を作成：

```typescript
import { useLoaderData } from "react-router";
import type { UserRoleCode } from "~/utils/auth";

export function useAuth() {
  const data = useLoaderData<{
    user: {
      role_id: number;
      role: {
        id: number;
        code: string;
        name: string;
        level: number;
        description?: string;
      };
    };
  }>();

  const hasRole = (requiredRole: UserRoleCode | UserRoleCode[]): boolean => {
    if (!data?.user?.role?.code) return false;

    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return roles.includes(data.user.role.code as UserRoleCode);
  };

  const hasRoleLevel = (requiredLevel: number): boolean => {
    if (!data?.user?.role?.level) return false;
    return data.user.role.level >= requiredLevel;
  };

  return {
    user: data?.user,
    hasRole,
    hasRoleLevel,
    isAdmin: hasRole("admin"),
    isModerator: hasRole("moderator"),
    roleLevel: data?.user?.role?.level || 0,
    roleName: data?.user?.role?.name || "未設定",
  };
}
```

## 4. UI/UX の実装

### 4.1 権限に応じたナビゲーション制御

`app/components/layouts/adminLayout/adminLayout.tsx`を更新：

```typescript
// AdminSidebarコンポーネント内で権限に応じてメニューを制御
const { hasRole } = useAuth();

const sidebarMenuItems: SidebarMenuItem[] = [
  {
    to: "/admin",
    icon: <Home size={20} />,
    label: "ホーム",
    roles: ['admin', 'moderator'], // 必要な権限を指定
  },
  {
    to: "/admin/users",
    icon: <Users size={20} />,
    label: "ユーザー管理",
    roles: ['admin'], // 管理者のみ
  },
  // ...
].filter(item => !item.roles || item.roles.some(role => hasRole(role)));
```

### 4.2 アクセス拒否ページ

`app/routes/forbidden/route.tsx`を作成：

```typescript
export default function Forbidden() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">403</h1>
        <p className="text-xl text-gray-600 mb-8">アクセス権限がありません</p>
        <Link to="/" className="text-blue-600 hover:text-blue-800">
          ホームに戻る
        </Link>
      </div>
    </div>
  );
}
```

## 5. マイグレーション

### 5.1 データベースマイグレーション

`supabase/migrations/0001_add-user-roles.sql`を作成：

```sql
-- rolesテーブルの作成
CREATE TABLE public.roles (
  id bigserial PRIMARY KEY,
  code varchar(20) NOT NULL UNIQUE,
  name varchar(50) NOT NULL,
  description text,
  level integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- codeにユニークインデックス（検索パフォーマンス向上）
CREATE INDEX idx_roles_code ON public.roles(code) WHERE is_active = true;

-- 初期データの挿入
INSERT INTO public.roles (code, name, description, level) VALUES
('user', '一般ユーザー', '基本的な機能を利用できます', 1),
('moderator', 'モデレーター', '一部の管理機能を利用できます', 5),
('admin', '管理者', 'すべての管理機能を利用できます', 10);

-- profilesテーブルにrole_idカラムを追加
ALTER TABLE public.profiles
ADD COLUMN role_id bigint;

-- デフォルト値設定（userロールのIDを設定）
UPDATE public.profiles
SET role_id = (SELECT id FROM public.roles WHERE code = 'user');

-- NOT NULL制約追加
ALTER TABLE public.profiles
ALTER COLUMN role_id SET NOT NULL;

-- 外部キー制約を追加
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_id_fkey
FOREIGN KEY (role_id) REFERENCES public.roles(id);

-- インデックス追加
CREATE INDEX idx_profiles_role_id ON public.profiles(role_id);

-- rolesテーブルのRLS有効化
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- updated_at自動更新トリガー（rolesテーブル用）
CREATE TRIGGER handle_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- RLSポリシー追加
CREATE POLICY "Everyone can view active roles"
ON public.roles
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage roles"
ON public.roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()::text AND role_code = 'admin'
  )
);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()::text AND role_code = 'admin'
  )
);

CREATE POLICY "Admins can update user roles"
ON public.profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()::text AND role_code = 'admin'
  )
);

-- 初期管理者アカウントの設定（必要に応じて）
-- UPDATE public.profiles SET role_id = (SELECT id FROM public.roles WHERE code = 'admin') WHERE user_id = 'your-admin-user-id';
```

### 5.2 Clerk Webhookの更新

`supabase/functions/clerk-webhook/index.ts`を更新して、新規ユーザー作成時にデフォルトroleを設定：

```typescript
case "user.created": {
  // userロールのIDを取得
  const { data: userRole } = await supabase
    .from("roles")
    .select("id")
    .eq("code", "user")
    .single();

  const { error } = await supabase.from("profiles").insert([
    {
      user_id: event.data.id,
      name: event.data.first_name + " " + event.data.last_name,
      role_id: userRole?.id, // デフォルトrole_idを設定
      created_at: new Date(event.data.created_at).toISOString(),
      updated_at: new Date(event.data.updated_at).toISOString(),
    },
  ]);
  // ...
}
```

## 6. 実装順序

### Phase 1: データベース設計

1. マイグレーションファイルの作成
2. Drizzleスキーマの更新
3. マイグレーションの実行

### Phase 2: 権限制御ロジック

1. `app/utils/auth.ts`の実装
2. `app/hooks/useAuth.ts`の実装
3. Admin Layout loaderの更新

### Phase 3: UI/UX

1. 権限に応じたナビゲーション制御
2. アクセス拒否ページの作成
3. ユーザー管理画面の作成（管理者用）

### Phase 4: テスト・デバッグ

1. 権限制御の動作確認
2. エラーハンドリングの確認
3. セキュリティテスト

## 7. セキュリティ考慮事項

- **サーバーサイド検証**: すべての権限チェックはサーバーサイドで実行
- **RLS活用**: Supabaseの行レベルセキュリティを活用
- **最小権限原則**: 必要最小限の権限のみ付与
- **監査ログ**: 重要な操作のログ記録（将来実装）

## 8. 将来の拡張性

- **詳細権限**: 機能別の詳細な権限制御
- **組織管理**: 組織単位での権限管理
- **一時的権限**: 期限付き権限の付与
- **権限継承**: 階層的な権限構造

## 9. 注意点

- 既存ユーザーへのデフォルトrole設定
- マイグレーション時のダウンタイム最小化
- 権限変更時のセッション管理
- フロントエンドキャッシュの無効化
