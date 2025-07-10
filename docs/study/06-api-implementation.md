# API実装 - 権限制御を組み込んだAPIの作り方

## 🎯 この章で学ぶこと

- React Router v7でのAPI実装
- 権限チェックの組み込み方
- エラーハンドリングとレスポンス設計
- 実際のAPIエンドポイント例

## 🚀 基本的なAPI構造

### 1. **ディレクトリ構成**

```
app/
├── routes/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── profile.ts          # プロフィール関連
│   │   │   └── permissions.ts      # 権限チェック
│   │   ├── admin/
│   │   │   ├── users.ts            # ユーザー管理
│   │   │   └── roles.ts            # ロール管理
│   │   └── public/
│   │       └── health.ts           # ヘルスチェック
│   └── _index.tsx
├── lib/
│   ├── auth/
│   │   ├── permissions.ts          # 権限チェック関数
│   │   ├── middleware.ts           # 認証ミドルウェア
│   │   └── types.ts                # 型定義
│   └── db/
│       └── supabase.ts             # DB接続
└── utils/
    ├── api-response.ts             # レスポンス統一
    └── error-handler.ts            # エラーハンドリング
```

### 2. **基本的なAPIレスポンス形式**

```typescript
// utils/api-response.ts
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
    };
    timestamp: string;
  };
}

export function successResponse<T>(
  data: T,
  meta?: ApiResponse["meta"],
): ApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}

export function errorResponse(
  code: string,
  message: string,
  details?: any,
): ApiResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };
}
```

## 🔐 認証・権限チェックの実装

### 1. **権限チェック関数**

```typescript
// lib/auth/permissions.ts
import { supabase } from "~/lib/db/supabase";

export interface UserWithRole {
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

export async function getCurrentUser(
  request: Request,
): Promise<UserWithRole | null> {
  try {
    // Clerkからユーザー情報を取得
    const { userId } = await getAuth(request);
    if (!userId) return null;

    // Supabaseからプロフィール情報を取得
    const { data, error } = await supabase
      .from("profiles")
      .select(
        `
        *,
        roles (
          id,
          code,
          name,
          permission_level
        )
      `,
      )
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    if (error || !data) return null;

    return data as UserWithRole;
  } catch (error) {
    console.error("Failed to get current user:", error);
    return null;
  }
}

export async function hasPermission(
  userId: string,
  permissionCode: string,
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        `
        roles (
          role_permissions (
            permissions (
              code
            )
          )
        )
      `,
      )
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    if (error || !data) return false;

    // 権限をフラット化して検索
    const userPermissions =
      data.roles?.role_permissions
        ?.map((rp: any) => rp.permissions.code)
        .flat() || [];

    return userPermissions.includes(permissionCode);
  } catch (error) {
    console.error("Failed to check permission:", error);
    return false;
  }
}

export async function hasRole(
  userId: string,
  roleCode: string,
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        `
        roles (
          code
        )
      `,
      )
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    if (error || !data) return false;

    return data.roles?.code === roleCode;
  } catch (error) {
    console.error("Failed to check role:", error);
    return false;
  }
}

export async function hasMinimumLevel(
  userId: string,
  minimumLevel: number,
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        `
        roles (
          permission_level
        )
      `,
      )
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    if (error || !data) return false;

    return (data.roles?.permission_level || 0) >= minimumLevel;
  } catch (error) {
    console.error("Failed to check permission level:", error);
    return false;
  }
}
```

### 2. **認証ミドルウェア**

```typescript
// lib/auth/middleware.ts
import { json } from "@remix-run/node";
import {
  getCurrentUser,
  hasPermission,
  hasRole,
  hasMinimumLevel,
} from "./permissions";
import { errorResponse } from "~/utils/api-response";

export async function requireAuth(request: Request) {
  const user = await getCurrentUser(request);

  if (!user) {
    throw json(errorResponse("UNAUTHORIZED", "認証が必要です"), {
      status: 401,
    });
  }

  return user;
}

export async function requirePermission(
  request: Request,
  permissionCode: string,
) {
  const user = await requireAuth(request);

  const hasRequiredPermission = await hasPermission(
    user.user_id,
    permissionCode,
  );

  if (!hasRequiredPermission) {
    throw json(
      errorResponse("FORBIDDEN", `権限が不足しています: ${permissionCode}`),
      { status: 403 },
    );
  }

  return user;
}

export async function requireRole(request: Request, roleCode: string) {
  const user = await requireAuth(request);

  const hasRequiredRole = await hasRole(user.user_id, roleCode);

  if (!hasRequiredRole) {
    throw json(
      errorResponse("FORBIDDEN", `必要なロールがありません: ${roleCode}`),
      { status: 403 },
    );
  }

  return user;
}

export async function requireMinimumLevel(
  request: Request,
  minimumLevel: number,
) {
  const user = await requireAuth(request);

  const hasRequiredLevel = await hasMinimumLevel(user.user_id, minimumLevel);

  if (!hasRequiredLevel) {
    throw json(
      errorResponse(
        "FORBIDDEN",
        `権限レベルが不足しています (必要: ${minimumLevel})`,
      ),
      { status: 403 },
    );
  }

  return user;
}

// 自分のデータまたは管理者権限をチェック
export async function requireSelfOrAdmin(
  request: Request,
  targetUserId: string,
) {
  const user = await requireAuth(request);

  // 自分のデータの場合はOK
  if (user.user_id === targetUserId) {
    return user;
  }

  // 管理者権限をチェック
  const isAdmin = await hasRole(user.user_id, "admin");

  if (!isAdmin) {
    throw json(
      errorResponse("FORBIDDEN", "自分のデータまたは管理者権限が必要です"),
      { status: 403 },
    );
  }

  return user;
}
```

## 📝 具体的なAPIエンドポイント実装

### 1. **プロフィール関連API**

```typescript
// routes/api/auth/profile.ts
import {
  json,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "@remix-run/node";
import { supabase } from "~/lib/db/supabase";
import { requireAuth, requireSelfOrAdmin } from "~/lib/auth/middleware";
import { successResponse, errorResponse } from "~/utils/api-response";

// GET /api/auth/profile - 自分のプロフィール取得
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const user = await requireAuth(request);

    const { data, error } = await supabase
      .from("profiles")
      .select(
        `
        id,
        user_id,
        email,
        username,
        full_name,
        avatar_url,
        created_at,
        updated_at,
        roles (
          id,
          code,
          name,
          permission_level
        )
      `,
      )
      .eq("user_id", user.user_id)
      .single();

    if (error) {
      return json(
        errorResponse("PROFILE_NOT_FOUND", "プロフィールが見つかりません"),
        { status: 404 },
      );
    }

    return json(successResponse(data));
  } catch (error) {
    if (error instanceof Response) throw error;

    return json(
      errorResponse("INTERNAL_ERROR", "サーバーエラーが発生しました"),
      { status: 500 },
    );
  }
}

// PUT /api/auth/profile - プロフィール更新
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "PUT") {
    return json(
      errorResponse("METHOD_NOT_ALLOWED", "許可されていないメソッドです"),
      { status: 405 },
    );
  }

  try {
    const user = await requireAuth(request);
    const body = await request.json();

    // 更新可能なフィールドのみを抽出
    const allowedFields = ["username", "full_name", "avatar_url"];
    const updateData = Object.fromEntries(
      Object.entries(body).filter(([key]) => allowedFields.includes(key)),
    );

    if (Object.keys(updateData).length === 0) {
      return json(
        errorResponse("INVALID_INPUT", "更新するデータがありません"),
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.user_id)
      .select()
      .single();

    if (error) {
      return json(
        errorResponse("UPDATE_FAILED", "プロフィールの更新に失敗しました"),
        { status: 500 },
      );
    }

    return json(successResponse(data));
  } catch (error) {
    if (error instanceof Response) throw error;

    return json(
      errorResponse("INTERNAL_ERROR", "サーバーエラーが発生しました"),
      { status: 500 },
    );
  }
}
```

### 2. **権限チェックAPI**

```typescript
// routes/api/auth/permissions.ts
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { hasPermission, hasRole, getCurrentUser } from "~/lib/auth/permissions";
import { successResponse, errorResponse } from "~/utils/api-response";

// GET /api/auth/permissions?check=permission_code
// GET /api/auth/permissions?role=role_code
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return json(errorResponse("UNAUTHORIZED", "認証が必要です"), {
        status: 401,
      });
    }

    const url = new URL(request.url);
    const permissionCode = url.searchParams.get("check");
    const roleCode = url.searchParams.get("role");

    if (permissionCode) {
      // 特定の権限をチェック
      const hasRequiredPermission = await hasPermission(
        user.user_id,
        permissionCode,
      );

      return json(
        successResponse({
          permission: permissionCode,
          hasPermission: hasRequiredPermission,
        }),
      );
    }

    if (roleCode) {
      // 特定のロールをチェック
      const hasRequiredRole = await hasRole(user.user_id, roleCode);

      return json(
        successResponse({
          role: roleCode,
          hasRole: hasRequiredRole,
        }),
      );
    }

    // 全権限を返す
    const { data: permissions } = await supabase
      .from("profiles")
      .select(
        `
        roles (
          code,
          name,
          permission_level,
          role_permissions (
            permissions (
              code,
              name,
              resource,
              action
            )
          )
        )
      `,
      )
      .eq("user_id", user.user_id)
      .single();

    const userPermissions =
      permissions?.roles?.role_permissions?.map((rp: any) => rp.permissions) ||
      [];

    return json(
      successResponse({
        user: {
          id: user.id,
          username: user.username,
          role: permissions?.roles,
        },
        permissions: userPermissions,
      }),
    );
  } catch (error) {
    return json(
      errorResponse("INTERNAL_ERROR", "サーバーエラーが発生しました"),
      { status: 500 },
    );
  }
}
```

### 3. **管理者用ユーザー管理API**

```typescript
// routes/api/admin/users.ts
import {
  json,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "@remix-run/node";
import { supabase } from "~/lib/db/supabase";
import { requireRole, requirePermission } from "~/lib/auth/middleware";
import { successResponse, errorResponse } from "~/utils/api-response";

// GET /api/admin/users - ユーザー一覧取得
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // 管理者またはモデレーター権限が必要
    await requirePermission(request, "users.read");

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const search = url.searchParams.get("search") || "";
    const roleFilter = url.searchParams.get("role") || "";

    let query = supabase.from("profiles").select(
      `
        id,
        user_id,
        email,
        username,
        full_name,
        avatar_url,
        is_active,
        created_at,
        updated_at,
        roles (
          id,
          code,
          name,
          permission_level
        )
      `,
      { count: "exact" },
    );

    // 検索条件を追加
    if (search) {
      query = query.or(
        `username.ilike.%${search}%,full_name.ilike.%${search}%,email.ilike.%${search}%`,
      );
    }

    if (roleFilter) {
      query = query.eq("roles.code", roleFilter);
    }

    // ページネーション
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query
      .range(from, to)
      .order("created_at", { ascending: false });

    if (error) {
      return json(
        errorResponse("FETCH_FAILED", "ユーザー一覧の取得に失敗しました"),
        { status: 500 },
      );
    }

    return json(
      successResponse(data, {
        pagination: {
          page,
          limit,
          total: count || 0,
        },
      }),
    );
  } catch (error) {
    if (error instanceof Response) throw error;

    return json(
      errorResponse("INTERNAL_ERROR", "サーバーエラーが発生しました"),
      { status: 500 },
    );
  }
}

// POST /api/admin/users - 新規ユーザー作成（通常はClerkで自動作成）
// PUT /api/admin/users/:userId - ユーザー情報更新
// DELETE /api/admin/users/:userId - ユーザー削除
export async function action({ request, params }: ActionFunctionArgs) {
  const { userId } = params;

  try {
    if (request.method === "PUT" && userId) {
      // ユーザー情報更新
      await requirePermission(request, "users.update");

      const body = await request.json();
      const allowedFields = ["username", "full_name", "is_active", "role_id"];
      const updateData = Object.fromEntries(
        Object.entries(body).filter(([key]) => allowedFields.includes(key)),
      );

      const { data, error } = await supabase
        .from("profiles")
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .select(
          `
          *,
          roles (
            id,
            code,
            name,
            permission_level
          )
        `,
        )
        .single();

      if (error) {
        return json(
          errorResponse("UPDATE_FAILED", "ユーザー情報の更新に失敗しました"),
          { status: 500 },
        );
      }

      return json(successResponse(data));
    }

    if (request.method === "DELETE" && userId) {
      // ユーザー削除（論理削除）
      await requirePermission(request, "users.delete");

      const { error } = await supabase
        .from("profiles")
        .update({
          is_active: false,
          deleted_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (error) {
        return json(
          errorResponse("DELETE_FAILED", "ユーザーの削除に失敗しました"),
          { status: 500 },
        );
      }

      return json(successResponse({ message: "ユーザーを削除しました" }));
    }

    return json(
      errorResponse("METHOD_NOT_ALLOWED", "許可されていないメソッドです"),
      { status: 405 },
    );
  } catch (error) {
    if (error instanceof Response) throw error;

    return json(
      errorResponse("INTERNAL_ERROR", "サーバーエラーが発生しました"),
      { status: 500 },
    );
  }
}
```

### 4. **ロール管理API**

```typescript
// routes/api/admin/roles.ts
import {
  json,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "@remix-run/node";
import { supabase } from "~/lib/db/supabase";
import { requireRole } from "~/lib/auth/middleware";
import { successResponse, errorResponse } from "~/utils/api-response";

// GET /api/admin/roles - ロール一覧取得
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // 管理者権限が必要
    await requireRole(request, "admin");

    const { data, error } = await supabase
      .from("roles")
      .select(
        `
        id,
        code,
        name,
        permission_level,
        description,
        is_active,
        created_at,
        role_permissions (
          permissions (
            id,
            code,
            name,
            resource,
            action,
            description
          )
        )
      `,
      )
      .eq("is_active", true)
      .order("permission_level", { ascending: true });

    if (error) {
      return json(
        errorResponse("FETCH_FAILED", "ロール一覧の取得に失敗しました"),
        { status: 500 },
      );
    }

    return json(successResponse(data));
  } catch (error) {
    if (error instanceof Response) throw error;

    return json(
      errorResponse("INTERNAL_ERROR", "サーバーエラーが発生しました"),
      { status: 500 },
    );
  }
}

// POST /api/admin/roles - 新規ロール作成
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json(
      errorResponse("METHOD_NOT_ALLOWED", "許可されていないメソッドです"),
      { status: 405 },
    );
  }

  try {
    await requireRole(request, "admin");

    const body = await request.json();
    const { code, name, permission_level, description, permission_ids } = body;

    // バリデーション
    if (!code || !name || permission_level === undefined) {
      return json(
        errorResponse("INVALID_INPUT", "必須フィールドが不足しています"),
        { status: 400 },
      );
    }

    // ロールを作成
    const { data: roleData, error: roleError } = await supabase
      .from("roles")
      .insert({
        code,
        name,
        permission_level,
        description,
      })
      .select()
      .single();

    if (roleError) {
      return json(
        errorResponse("CREATE_FAILED", "ロールの作成に失敗しました"),
        { status: 500 },
      );
    }

    // 権限を関連付け
    if (permission_ids && permission_ids.length > 0) {
      const rolePermissions = permission_ids.map((permissionId: number) => ({
        role_id: roleData.id,
        permission_id: permissionId,
      }));

      const { error: permissionError } = await supabase
        .from("role_permissions")
        .insert(rolePermissions);

      if (permissionError) {
        // ロールを削除してロールバック
        await supabase.from("roles").delete().eq("id", roleData.id);

        return json(
          errorResponse(
            "PERMISSION_ASSIGN_FAILED",
            "権限の割り当てに失敗しました",
          ),
          { status: 500 },
        );
      }
    }

    return json(successResponse(roleData));
  } catch (error) {
    if (error instanceof Response) throw error;

    return json(
      errorResponse("INTERNAL_ERROR", "サーバーエラーが発生しました"),
      { status: 500 },
    );
  }
}
```

## 🔄 エラーハンドリングとログ

### 1. **統一されたエラーハンドリング**

```typescript
// utils/error-handler.ts
import { json } from "@remix-run/node";
import { errorResponse } from "./api-response";

export class ApiError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: any,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function handleApiError(error: unknown) {
  console.error("API Error:", error);

  if (error instanceof ApiError) {
    return json(errorResponse(error.code, error.message, error.details), {
      status: error.statusCode,
    });
  }

  if (error instanceof Response) {
    throw error;
  }

  // 予期しないエラー
  return json(errorResponse("INTERNAL_ERROR", "サーバーエラーが発生しました"), {
    status: 500,
  });
}

// 使用例
export async function someApiFunction(request: Request) {
  try {
    // API処理
    const result = await processData();
    return json(successResponse(result));
  } catch (error) {
    return handleApiError(error);
  }
}
```

### 2. **リクエストログ**

```typescript
// lib/middleware/logging.ts
export async function logRequest(request: Request, response: Response) {
  const start = Date.now();
  const method = request.method;
  const url = request.url;
  const userAgent = request.headers.get("user-agent");
  const ip = request.headers.get("x-forwarded-for") || "unknown";

  // レスポンス後にログを出力
  const duration = Date.now() - start;
  const status = response.status;

  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      method,
      url,
      status,
      duration,
      ip,
      userAgent,
    }),
  );
}
```

## 🧪 APIテスト

### 1. **権限テスト**

```typescript
// tests/api/permissions.test.ts
import { describe, test, expect } from "vitest";
import { createRequest } from "./test-utils";

describe("権限API", () => {
  test("認証なしでアクセスすると401が返される", async () => {
    const request = createRequest("GET", "/api/auth/profile");
    const response = await loader({ request });

    expect(response.status).toBe(401);
  });

  test("一般ユーザーは管理者APIにアクセスできない", async () => {
    const request = createRequest("GET", "/api/admin/users", {
      userId: "user_123",
      role: "user",
    });

    const response = await loader({ request });
    expect(response.status).toBe(403);
  });

  test("管理者は管理者APIにアクセスできる", async () => {
    const request = createRequest("GET", "/api/admin/users", {
      userId: "admin_123",
      role: "admin",
    });

    const response = await loader({ request });
    expect(response.status).toBe(200);
  });
});
```

### 2. **統合テスト**

```typescript
// tests/api/integration.test.ts
describe("ユーザー管理フロー", () => {
  test("管理者がユーザーのロールを変更できる", async () => {
    // 1. 管理者でログイン
    const adminToken = await loginAsAdmin();

    // 2. ユーザー一覧を取得
    const usersResponse = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(usersResponse.status).toBe(200);

    // 3. 特定ユーザーのロールを変更
    const targetUserId = usersResponse.body.data[0].user_id;
    const updateResponse = await request(app)
      .put(`/api/admin/users/${targetUserId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ role_id: 2 }); // モデレーターに変更

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.roles.code).toBe("moderator");
  });
});
```

## 🔧 パフォーマンス最適化

### 1. **権限情報のキャッシュ**

```typescript
// lib/cache/permissions.ts
const permissionCache = new Map<
  string,
  { permissions: string[]; expires: number }
>();
const CACHE_TTL = 5 * 60 * 1000; // 5分

export async function getCachedPermissions(userId: string): Promise<string[]> {
  const cached = permissionCache.get(userId);

  if (cached && cached.expires > Date.now()) {
    return cached.permissions;
  }

  // キャッシュミス：DBから取得
  const permissions = await fetchUserPermissions(userId);

  permissionCache.set(userId, {
    permissions,
    expires: Date.now() + CACHE_TTL,
  });

  return permissions;
}

export function clearPermissionCache(userId: string) {
  permissionCache.delete(userId);
}
```

### 2. **データベースクエリの最適化**

```sql
-- 権限チェック用のビューを作成
CREATE VIEW v_user_permissions AS
SELECT
  p.user_id,
  p.username,
  r.code as role_code,
  r.permission_level,
  perm.code as permission_code,
  perm.resource,
  perm.action
FROM profiles p
JOIN roles r ON p.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions perm ON rp.permission_id = perm.id
WHERE p.is_active = true
  AND r.is_active = true
  AND perm.is_active = true;

-- インデックスの作成
CREATE INDEX idx_user_permissions_lookup
ON v_user_permissions (user_id, permission_code);
```

## 🤔 よくある質問

### Q1: APIのバージョニングはどうすべき？

**A:** URLパス（`/api/v1/users`）またはヘッダー（`Accept: application/vnd.api+json;version=1`）でバージョン管理を行います。

### Q2: レート制限は必要？

**A:** 本番環境では必須です。Cloudflareやnginxでの制限、またはアプリケーションレベルでの実装を検討してください。

### Q3: APIドキュメントの自動生成は？

**A:** TypeScriptの型定義からOpenAPI仕様を生成するツール（tRPC、Zodなど）の使用を推奨します。

### Q4: 権限チェックのパフォーマンスが心配です

**A:**

- 権限情報のキャッシュ
- データベースビューの活用
- 適切なインデックス設計
  で大幅に改善できます。

---

**前へ**: [セキュリティ](./05-security.md) ←  
**次へ**: [フロントエンド実装](./07-frontend-implementation.md) →
