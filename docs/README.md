# pukusapo ユーザーロール機能実装ガイド

## 📋 概要

pukusapo（フォーム作成・管理システム）に管理者権限機能を追加するためのガイドです。

### 実装する機能

- **3つのロール**: `user`（一般）、`moderator`（モデレーター）、`admin`（管理者）
- **管理画面の保護**: `/admin`以下のルートへのアクセス制御
- **自動ロール割り当て**: 新規ユーザーは`user`ロールで開始

## 🚀 実装手順

### 1. データベース設定

```bash
# マイグレーション実行
npm run db:migrate
```

これで以下が作成されます：

- `roles`テーブル（ロール定義）
- `profiles`テーブルに`role_id`カラム追加
- 初期ロールデータ（user, moderator, admin）

### 2. Drizzleスキーマ更新

```typescript
// app/db/schema/roles.ts
export const roles = pgTable("roles", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  code: varchar("code", { length: 50 }).unique().notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  permissionLevel: integer("permission_level").default(0),
});

// app/db/schema/profiles.ts
export const profiles = pgTable("profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().unique(),
  roleId: bigint("role_id", { mode: "number" }).references(() => roles.id),
  name: varchar("name", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}).enableRLS();
```

### 3. 権限チェック関数作成

```typescript
// app/lib/auth.server.ts
import { getAuth } from "@clerk/react-router/ssr.server";
import { db } from "~/db/client.server";
import { profiles, roles } from "~/db/schema";
import { eq } from "drizzle-orm";

export async function requireAuth(request: Request) {
  const { userId } = await getAuth(request);
  if (!userId) {
    throw redirect("/auth/signin");
  }
  return userId;
}

export async function getUserWithRole(userId: string) {
  const result = await db
    .select({
      userId: profiles.userId,
      name: profiles.name,
      roleCode: roles.code,
      roleName: roles.name,
      permissionLevel: roles.permissionLevel,
    })
    .from(profiles)
    .leftJoin(roles, eq(profiles.roleId, roles.id))
    .where(eq(profiles.userId, userId))
    .limit(1);

  return result[0] || null;
}

export async function requireRole(request: Request, minLevel: number) {
  const userId = await requireAuth(request);
  const user = await getUserWithRole(userId);

  if (!user || (user.permissionLevel || 0) < minLevel) {
    throw new Response("Forbidden", { status: 403 });
  }

  return user;
}
```

### 4. 管理画面の保護

```typescript
// app/routes/_admin-layout/route.tsx
import type { LoaderFunctionArgs } from "react-router";
import { json, redirect } from "react-router";
import { Outlet } from "react-router";
import { requireRole } from "~/lib/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  // モデレーター以上の権限が必要（permission_level >= 50）
  const user = await requireRole(request, 50);
  return json({ user });
}

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="py-6 text-2xl font-bold text-gray-900">
            管理画面
          </h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
```

### 5. Clerk Webhook設定

```typescript
// app/routes/api/webhooks/clerk.tsx
import type { ActionFunctionArgs } from "react-router";
import { json } from "react-router";
import { Webhook } from "svix";
import { db } from "~/db/client.server";
import { profiles, roles } from "~/db/schema";
import { eq } from "drizzle-orm";

export async function action({ request }: ActionFunctionArgs) {
  const payload = await request.text();
  const headers = Object.fromEntries(request.headers);

  const webhook = new Webhook(process.env.CLERK_WEBHOOK_SIGNING_SECRET!);
  const event = webhook.verify(payload, headers);

  if (event.type === "user.created") {
    // デフォルトでuserロールを割り当て
    const userRole = await db
      .select()
      .from(roles)
      .where(eq(roles.code, "user"))
      .limit(1);

    if (userRole[0]) {
      await db.insert(profiles).values({
        userId: event.data.id,
        roleId: userRole[0].id,
        name: `${event.data.first_name} ${event.data.last_name}`.trim(),
      });
    }
  }

  return json({ success: true });
}
```

## 🔧 使用例

### フロントエンドでの権限チェック

```typescript
// app/hooks/useAuth.ts
import { useUser } from "@clerk/react-router";
import { useFetcher } from "react-router";
import { useEffect, useState } from "react";

interface UserWithRole {
  userId: string;
  name: string;
  roleCode: string;
  roleName: string;
  permissionLevel: number;
}

export function useAuth() {
  const { user } = useUser();
  const [userWithRole, setUserWithRole] = useState<UserWithRole | null>(null);
  const fetcher = useFetcher();

  useEffect(() => {
    if (user && !userWithRole) {
      fetcher.load(`/api/user/profile`);
    }
  }, [user, userWithRole]);

  const hasPermission = (minLevel: number) => {
    return (userWithRole?.permissionLevel || 0) >= minLevel;
  };

  const isAdmin = () => hasPermission(100);
  const isModerator = () => hasPermission(50);

  return {
    user: userWithRole,
    hasPermission,
    isAdmin,
    isModerator,
    loading: fetcher.state === "loading",
  };
}
```

### 条件付きメニュー表示

```typescript
// app/components/Navigation.tsx
import { Link } from "react-router";
import { useAuth } from "~/hooks/useAuth";

export function Navigation() {
  const { isModerator, isAdmin } = useAuth();

  return (
    <nav>
      <Link to="/">ホーム</Link>
      <Link to="/forms">フォーム</Link>

      {isModerator() && (
        <Link to="/admin">管理画面</Link>
      )}

      {isAdmin() && (
        <Link to="/admin/system">システム設定</Link>
      )}
    </nav>
  );
}
```

## 📊 権限レベル

| ロール      | レベル | 説明                     |
| ----------- | ------ | ------------------------ |
| `user`      | 1      | 一般ユーザー             |
| `moderator` | 50     | モデレーター（管理補助） |
| `admin`     | 100    | 管理者（全権限）         |

## 🛡️ セキュリティポイント

1. **フロントエンド**: UIの表示制御のみ
2. **API**: 実際の権限チェック
3. **データベース**: RLSによる最終防御

## 🐛 トラブルシューティング

### よくある問題

**管理画面にアクセスできない**
→ ユーザーのロールを確認してください

```sql
SELECT p.user_id, r.code, r.name
FROM profiles p
JOIN roles r ON p.role_id = r.id
WHERE p.user_id = 'your_clerk_user_id';
```

**新規ユーザーにロールが割り当てられない**
→ Clerk Webhookの設定を確認してください

---

この実装により、pukusapoに基本的なユーザーロール機能が追加されます。
