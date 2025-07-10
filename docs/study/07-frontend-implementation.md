# フロントエンド実装 - React Router v7での権限制御UI

## 🎯 この章で学ぶこと

- React Router v7での権限制御
- カスタムフックの実装
- 条件付きレンダリング
- ユーザーフレンドリーなUI設計

## 🧩 基本的なHooks実装

### 1. **useAuth Hook**

```typescript
// app/hooks/useAuth.ts
import { useLoaderData, useFetcher } from "@remix-run/react";
import { useUser } from "@clerk/remix";
import { useEffect, useState } from "react";

interface UserRole {
  id: number;
  code: string;
  name: string;
  permission_level: number;
}

interface AuthUser {
  id: string;
  user_id: string;
  email: string;
  username: string;
  full_name: string;
  role: UserRole;
}

export function useAuth() {
  const { user: clerkUser } = useUser();
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const fetcher = useFetcher();

  useEffect(() => {
    if (clerkUser && !authUser) {
      // プロフィール情報を取得
      fetcher.load("/api/auth/profile");
    }
  }, [clerkUser, authUser]);

  useEffect(() => {
    if (fetcher.data?.success) {
      setAuthUser(fetcher.data.data);
      setLoading(false);
    } else if (fetcher.data?.success === false) {
      setLoading(false);
    }
  }, [fetcher.data]);

  return {
    user: authUser,
    clerkUser,
    loading: loading || fetcher.state === "loading",
    isAuthenticated: !!clerkUser && !!authUser,
    role: authUser?.role,
    refetch: () => fetcher.load("/api/auth/profile"),
  };
}
```

### 2. **usePermission Hook**

```typescript
// app/hooks/usePermission.ts
import { useFetcher } from "@remix-run/react";
import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";

export function usePermission(permissionCode: string) {
  const { user, isAuthenticated } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);
  const fetcher = useFetcher();

  useEffect(() => {
    if (!isAuthenticated) {
      setHasPermission(false);
      setLoading(false);
      return;
    }

    if (user && permissionCode) {
      fetcher.load(`/api/auth/permissions?check=${permissionCode}`);
    }
  }, [user, permissionCode, isAuthenticated]);

  useEffect(() => {
    if (fetcher.data?.success) {
      setHasPermission(fetcher.data.data.hasPermission);
      setLoading(false);
    } else if (fetcher.data?.success === false) {
      setHasPermission(false);
      setLoading(false);
    }
  }, [fetcher.data]);

  return {
    hasPermission,
    loading: loading || fetcher.state === "loading",
    refetch: () => {
      if (permissionCode) {
        fetcher.load(`/api/auth/permissions?check=${permissionCode}`);
      }
    },
  };
}

export function useRole(roleCode: string) {
  const { user, isAuthenticated } = useAuth();
  const [hasRole, setHasRole] = useState(false);
  const [loading, setLoading] = useState(true);
  const fetcher = useFetcher();

  useEffect(() => {
    if (!isAuthenticated) {
      setHasRole(false);
      setLoading(false);
      return;
    }

    if (user && roleCode) {
      fetcher.load(`/api/auth/permissions?role=${roleCode}`);
    }
  }, [user, roleCode, isAuthenticated]);

  useEffect(() => {
    if (fetcher.data?.success) {
      setHasRole(fetcher.data.data.hasRole);
      setLoading(false);
    } else if (fetcher.data?.success === false) {
      setHasRole(false);
      setLoading(false);
    }
  }, [fetcher.data]);

  return {
    hasRole,
    loading: loading || fetcher.state === "loading",
  };
}
```

## 🛡️ 権限制御コンポーネント

### 1. **ProtectedRoute コンポーネント**

```typescript
// app/components/auth/ProtectedRoute.tsx
import { ReactNode } from "react";
import { useAuth } from "~/hooks/useAuth";
import { usePermission, useRole } from "~/hooks/usePermission";
import { LoadingSpinner } from "~/components/ui/LoadingSpinner";
import { ErrorMessage } from "~/components/ui/ErrorMessage";

interface ProtectedRouteProps {
  children: ReactNode;
  permission?: string;
  role?: string;
  minimumLevel?: number;
  fallback?: ReactNode;
  loadingComponent?: ReactNode;
}

export function ProtectedRoute({
  children,
  permission,
  role,
  minimumLevel,
  fallback,
  loadingComponent = <LoadingSpinner />,
}: ProtectedRouteProps) {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { hasPermission, loading: permissionLoading } = usePermission(
    permission || ""
  );
  const { hasRole, loading: roleLoading } = useRole(role || "");

  // ローディング状態
  if (authLoading || permissionLoading || roleLoading) {
    return <>{loadingComponent}</>;
  }

  // 認証チェック
  if (!isAuthenticated) {
    return (
      <ErrorMessage
        title="認証が必要です"
        message="この機能を利用するにはログインしてください。"
        type="warning"
      />
    );
  }

  // 権限チェック
  if (permission && !hasPermission) {
    return (
      fallback || (
        <ErrorMessage
          title="権限が不足しています"
          message={`この機能を利用するには「${permission}」権限が必要です。`}
          type="error"
        />
      )
    );
  }

  // ロールチェック
  if (role && !hasRole) {
    return (
      fallback || (
        <ErrorMessage
          title="ロールが不足しています"
          message={`この機能を利用するには「${role}」ロールが必要です。`}
          type="error"
        />
      )
    );
  }

  // レベルチェック
  if (minimumLevel && user && user.role.permission_level < minimumLevel) {
    return (
      fallback || (
        <ErrorMessage
          title="権限レベルが不足しています"
          message={`この機能を利用するには権限レベル${minimumLevel}以上が必要です。`}
          type="error"
        />
      )
    );
  }

  return <>{children}</>;
}
```

### 2. **条件付きレンダリングコンポーネント**

```typescript
// app/components/auth/PermissionGuard.tsx
import { ReactNode } from "react";
import { usePermission, useRole } from "~/hooks/usePermission";
import { useAuth } from "~/hooks/useAuth";

interface PermissionGuardProps {
  children: ReactNode;
  permission?: string;
  role?: string;
  minimumLevel?: number;
  fallback?: ReactNode;
  inverse?: boolean; // 権限がない場合に表示
}

export function PermissionGuard({
  children,
  permission,
  role,
  minimumLevel,
  fallback = null,
  inverse = false,
}: PermissionGuardProps) {
  const { user } = useAuth();
  const { hasPermission, loading: permissionLoading } = usePermission(
    permission || ""
  );
  const { hasRole, loading: roleLoading } = useRole(role || "");

  // ローディング中は何も表示しない
  if (permissionLoading || roleLoading) {
    return null;
  }

  let hasAccess = true;

  // 権限チェック
  if (permission && !hasPermission) {
    hasAccess = false;
  }

  // ロールチェック
  if (role && !hasRole) {
    hasAccess = false;
  }

  // レベルチェック
  if (minimumLevel && user && user.role.permission_level < minimumLevel) {
    hasAccess = false;
  }

  // inverse が true の場合は逆の条件
  if (inverse) {
    hasAccess = !hasAccess;
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

// 使いやすいエイリアス
export const ShowForPermission = PermissionGuard;
export const ShowForRole = PermissionGuard;
export const HideForPermission = (props: PermissionGuardProps) => (
  <PermissionGuard {...props} inverse />
);
export const HideForRole = (props: PermissionGuardProps) => (
  <PermissionGuard {...props} inverse />
);
```

## 🎨 実際のページ実装例

### 1. **管理者ダッシュボード**

```typescript
// app/routes/admin._index.tsx
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { requireRole } from "~/lib/auth/middleware";
import { ProtectedRoute } from "~/components/auth/ProtectedRoute";
import { AdminStats } from "~/components/admin/AdminStats";
import { RecentActivity } from "~/components/admin/RecentActivity";

export async function loader({ request }: LoaderFunctionArgs) {
  // サーバーサイドでも権限チェック
  await requireRole(request, "admin");

  // 管理者向けデータを取得
  const stats = await getAdminStats();
  const recentActivity = await getRecentActivity();

  return json({ stats, recentActivity });
}

export default function AdminDashboard() {
  const { stats, recentActivity } = useLoaderData<typeof loader>();

  return (
    <ProtectedRoute role="admin">
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">管理者ダッシュボード</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AdminStats stats={stats} />
          <RecentActivity activities={recentActivity} />
        </div>
      </div>
    </ProtectedRoute>
  );
}
```

### 2. **ユーザー管理ページ**

```typescript
// app/routes/admin.users.tsx
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { useState } from "react";
import { requirePermission } from "~/lib/auth/middleware";
import { ProtectedRoute } from "~/components/auth/ProtectedRoute";
import { PermissionGuard } from "~/components/auth/PermissionGuard";
import { UserTable } from "~/components/admin/UserTable";
import { UserEditModal } from "~/components/admin/UserEditModal";

export async function loader({ request }: LoaderFunctionArgs) {
  await requirePermission(request, "users.read");

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const search = url.searchParams.get("search") || "";

  const users = await getUserList({ page, search });
  const roles = await getRoleList();

  return json({ users, roles });
}

export default function UsersPage() {
  const { users, roles } = useLoaderData<typeof loader>();
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  return (
    <ProtectedRoute permission="users.read">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">ユーザー管理</h1>

          <PermissionGuard permission="users.create">
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              onClick={() => {
                setSelectedUser(null);
                setIsEditModalOpen(true);
              }}
            >
              新規ユーザー作成
            </button>
          </PermissionGuard>
        </div>

        <UserTable
          users={users}
          onEdit={(user) => {
            setSelectedUser(user);
            setIsEditModalOpen(true);
          }}
          onDelete={(user) => {
            // 削除処理
          }}
        />

        {isEditModalOpen && (
          <UserEditModal
            user={selectedUser}
            roles={roles}
            onClose={() => setIsEditModalOpen(false)}
            onSave={() => {
              setIsEditModalOpen(false);
              // リフレッシュ処理
            }}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
```

### 3. **プロフィール編集ページ**

```typescript
// app/routes/profile.tsx
import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Form, useActionData, useNavigation } from "@remix-run/react";
import { requireAuth } from "~/lib/auth/middleware";
import { ProtectedRoute } from "~/components/auth/ProtectedRoute";
import { PermissionGuard } from "~/components/auth/PermissionGuard";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  return json({ user });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireAuth(request);
  const formData = await request.formData();

  const updateData = {
    username: formData.get("username"),
    full_name: formData.get("full_name"),
  };

  try {
    await updateProfile(user.user_id, updateData);
    return json({ success: true, message: "プロフィールを更新しました" });
  } catch (error) {
    return json({ success: false, error: "更新に失敗しました" }, { status: 400 });
  }
}

export default function ProfilePage() {
  const { user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">プロフィール設定</h1>

        {actionData?.success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {actionData.message}
          </div>
        )}

        {actionData?.error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {actionData.error}
          </div>
        )}

        <Form method="post" className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ユーザー名
            </label>
            <input
              type="text"
              name="username"
              defaultValue={user.username}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              表示名
            </label>
            <input
              type="text"
              name="full_name"
              defaultValue={user.full_name}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              メールアドレス
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              メールアドレスはClerkで管理されています
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              現在のロール
            </label>
            <div className="px-3 py-2 bg-gray-100 rounded-md">
              <span className="font-medium">{user.role.name}</span>
              <span className="text-gray-500 ml-2">
                (レベル: {user.role.permission_level})
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSubmitting ? "更新中..." : "プロフィールを更新"}
          </button>
        </Form>

        <PermissionGuard permission="admin.access">
          <div className="mt-8 p-4 bg-blue-50 rounded-md">
            <h3 className="font-medium text-blue-900 mb-2">管理者機能</h3>
            <p className="text-blue-700 text-sm mb-3">
              管理者権限でより詳細な設定が可能です
            </p>
            <a
              href="/admin"
              className="inline-block bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600"
            >
              管理者ダッシュボードへ
            </a>
          </div>
        </PermissionGuard>
      </div>
    </ProtectedRoute>
  );
}
```

## 🧩 再利用可能なUIコンポーネント

### 1. **RoleBasedButton**

```typescript
// app/components/ui/RoleBasedButton.tsx
import { ReactNode } from "react";
import { PermissionGuard } from "~/components/auth/PermissionGuard";

interface RoleBasedButtonProps {
  children: ReactNode;
  permission?: string;
  role?: string;
  minimumLevel?: number;
  onClick?: () => void;
  className?: string;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
}

export function RoleBasedButton({
  children,
  permission,
  role,
  minimumLevel,
  onClick,
  className = "",
  variant = "primary",
  disabled = false,
}: RoleBasedButtonProps) {
  const baseClasses = "px-4 py-2 rounded font-medium transition-colors";
  const variantClasses = {
    primary: "bg-blue-500 text-white hover:bg-blue-600",
    secondary: "bg-gray-500 text-white hover:bg-gray-600",
    danger: "bg-red-500 text-white hover:bg-red-600",
  };

  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${className} ${
    disabled ? "opacity-50 cursor-not-allowed" : ""
  }`;

  return (
    <PermissionGuard
      permission={permission}
      role={role}
      minimumLevel={minimumLevel}
    >
      <button
        onClick={onClick}
        disabled={disabled}
        className={buttonClasses}
      >
        {children}
      </button>
    </PermissionGuard>
  );
}
```

### 2. **UserRoleBadge**

```typescript
// app/components/ui/UserRoleBadge.tsx
interface UserRole {
  code: string;
  name: string;
  permission_level: number;
}

interface UserRoleBadgeProps {
  role: UserRole;
  showLevel?: boolean;
}

export function UserRoleBadge({ role, showLevel = false }: UserRoleBadgeProps) {
  const getBadgeColor = (roleCode: string) => {
    switch (roleCode) {
      case "admin":
        return "bg-red-100 text-red-800 border-red-200";
      case "moderator":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "user":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBadgeColor(
        role.code
      )}`}
    >
      {role.name}
      {showLevel && (
        <span className="ml-1 opacity-75">Lv.{role.permission_level}</span>
      )}
    </span>
  );
}
```

## 🔄 状態管理とキャッシュ

### 1. **権限情報のキャッシュ**

```typescript
// app/lib/cache/permissionCache.ts
class PermissionCache {
  private cache = new Map<string, { data: any; expires: number }>();
  private TTL = 5 * 60 * 1000; // 5分

  set(key: string, data: any) {
    this.cache.set(key, {
      data,
      expires: Date.now() + this.TTL,
    });
  }

  get(key: string) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (cached.expires < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clear(userId?: string) {
    if (userId) {
      // 特定ユーザーの権限情報をクリア
      for (const [key] of this.cache) {
        if (key.startsWith(`user:${userId}`)) {
          this.cache.delete(key);
        }
      }
    } else {
      // 全てクリア
      this.cache.clear();
    }
  }
}

export const permissionCache = new PermissionCache();
```

### 2. **グローバル状態管理（Zustand使用例）**

```typescript
// app/stores/authStore.ts
import { create } from "zustand";

interface AuthUser {
  id: string;
  user_id: string;
  email: string;
  username: string;
  full_name: string;
  role: {
    id: number;
    code: string;
    name: string;
    permission_level: number;
  };
}

interface AuthStore {
  user: AuthUser | null;
  permissions: string[];
  loading: boolean;
  setUser: (user: AuthUser | null) => void;
  setPermissions: (permissions: string[]) => void;
  setLoading: (loading: boolean) => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  hasMinimumLevel: (level: number) => boolean;
  clear: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  permissions: [],
  loading: true,

  setUser: (user) => set({ user }),
  setPermissions: (permissions) => set({ permissions }),
  setLoading: (loading) => set({ loading }),

  hasPermission: (permission) => {
    const { permissions } = get();
    return permissions.includes(permission);
  },

  hasRole: (role) => {
    const { user } = get();
    return user?.role.code === role;
  },

  hasMinimumLevel: (level) => {
    const { user } = get();
    return (user?.role.permission_level || 0) >= level;
  },

  clear: () => set({ user: null, permissions: [], loading: false }),
}));
```

## 🤔 よくある質問

### Q1: サーバーサイドとクライアントサイドの権限チェックの使い分けは？

**A:**

- **サーバーサイド**: セキュリティ重要、データアクセス制御
- **クライアントサイド**: UX向上、不要なUIの非表示

### Q2: 権限が変更された時の画面更新は？

**A:**

- リアルタイム更新（WebSocket）
- 定期的なポーリング
- ユーザーアクション時の再検証

### Q3: 大量の権限チェックがパフォーマンスに影響しませんか？

**A:**

- 権限情報のキャッシュ
- バッチでの権限取得
- メモ化の活用

### Q4: モバイル対応での注意点は？

**A:**

- タッチフレンドリーなUI
- 権限不足時の適切なフィードバック
- オフライン時の権限キャッシュ

---

**前へ**: [API実装](./06-api-implementation.md) ←  
**次へ**: [テスト](./08-testing.md) →
