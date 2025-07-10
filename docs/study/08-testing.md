# テスト - 権限システムの品質保証

## 🎯 この章で学ぶこと

- 権限システムのテスト戦略
- 単体テスト・統合テスト・E2Eテストの実装
- テストデータの準備方法
- CI/CDでの自動テスト

## 🧪 テスト戦略の概要

### 1. **テストピラミッド**

```
       🔺 E2Eテスト
      /   \  (少数・高コスト・実環境に近い)
     /     \
    /       \
   🔺 統合テスト
  /           \  (中程度・APIとDB連携)
 /             \
🔺 単体テスト 🔺
(多数・低コスト・高速)
```

### 2. **権限システムでテストすべき項目**

```typescript
// テスト対象の整理
const testAreas = {
  // 1. データベースレベル
  database: ["RLSポリシーの動作", "外部キー制約", "権限データの整合性"],

  // 2. APIレベル
  api: [
    "認証チェック",
    "権限チェック",
    "エラーレスポンス",
    "データフィルタリング",
  ],

  // 3. UIレベル
  ui: [
    "条件付きレンダリング",
    "権限に応じた機能制限",
    "エラー表示",
    "ユーザビリティ",
  ],

  // 4. セキュリティ
  security: [
    "権限昇格攻撃の防止",
    "SQLインジェクション対策",
    "セッションハイジャック対策",
  ],
};
```

## 🔬 単体テスト (Unit Tests)

### 1. **権限チェック関数のテスト**

```typescript
// tests/lib/auth/permissions.test.ts
import { describe, test, expect, beforeEach, vi } from "vitest";
import {
  hasPermission,
  hasRole,
  hasMinimumLevel,
} from "~/lib/auth/permissions";
import { createMockSupabaseClient } from "~/tests/utils/mockSupabase";

// Supabaseクライアントをモック
vi.mock("~/lib/db/supabase", () => ({
  supabase: createMockSupabaseClient(),
}));

describe("権限チェック関数", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("hasPermission", () => {
    test("ユーザーが指定した権限を持っている場合はtrueを返す", async () => {
      // モックデータの設定
      const mockUser = {
        roles: {
          role_permissions: [
            { permissions: { code: "users.read" } },
            { permissions: { code: "users.update" } },
          ],
        },
      };

      // Supabaseのレスポンスをモック
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUser,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await hasPermission("user_123", "users.read");
      expect(result).toBe(true);
    });

    test("ユーザーが指定した権限を持っていない場合はfalseを返す", async () => {
      const mockUser = {
        roles: {
          role_permissions: [{ permissions: { code: "users.read" } }],
        },
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUser,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await hasPermission("user_123", "users.delete");
      expect(result).toBe(false);
    });

    test("データベースエラーが発生した場合はfalseを返す", async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: new Error("Database error"),
              }),
            }),
          }),
        }),
      } as any);

      const result = await hasPermission("user_123", "users.read");
      expect(result).toBe(false);
    });
  });

  describe("hasRole", () => {
    test("ユーザーが指定したロールを持っている場合はtrueを返す", async () => {
      const mockUser = {
        roles: { code: "admin" },
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUser,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await hasRole("user_123", "admin");
      expect(result).toBe(true);
    });
  });

  describe("hasMinimumLevel", () => {
    test("ユーザーの権限レベルが最小要件を満たす場合はtrueを返す", async () => {
      const mockUser = {
        roles: { permission_level: 10 },
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUser,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await hasMinimumLevel("user_123", 5);
      expect(result).toBe(true);
    });

    test("ユーザーの権限レベルが最小要件を満たさない場合はfalseを返す", async () => {
      const mockUser = {
        roles: { permission_level: 3 },
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUser,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await hasMinimumLevel("user_123", 5);
      expect(result).toBe(false);
    });
  });
});
```

### 2. **React Hooksのテスト**

```typescript
// tests/hooks/usePermission.test.tsx
import { renderHook, waitFor } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import { usePermission } from "~/hooks/usePermission";
import { createWrapper } from "~/tests/utils/testWrapper";

// Remix関数をモック
vi.mock("@remix-run/react", () => ({
  useFetcher: () => ({
    data: null,
    state: "idle",
    load: vi.fn(),
  }),
}));

vi.mock("~/hooks/useAuth", () => ({
  useAuth: () => ({
    user: {
      id: "1",
      user_id: "user_123",
      role: { code: "user", permission_level: 1 },
    },
    isAuthenticated: true,
  }),
}));

describe("usePermission", () => {
  test("認証されていない場合は権限なしを返す", async () => {
    // useAuthをモックして認証なし状態にする
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
    });

    const { result } = renderHook(() => usePermission("users.read"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.hasPermission).toBe(false);
      expect(result.current.loading).toBe(false);
    });
  });

  test("権限チェックAPIが成功した場合は結果を返す", async () => {
    const mockFetcher = {
      data: { success: true, data: { hasPermission: true } },
      state: "idle",
      load: vi.fn(),
    };

    vi.mocked(useFetcher).mockReturnValue(mockFetcher);

    const { result } = renderHook(() => usePermission("users.read"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.hasPermission).toBe(true);
      expect(result.current.loading).toBe(false);
    });
  });
});
```

## 🔗 統合テスト (Integration Tests)

### 1. **APIエンドポイントのテスト**

```typescript
// tests/api/auth/profile.test.ts
import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { createRequest, createResponse } from "~/tests/utils/mockRequest";
import { loader, action } from "~/routes/api/auth/profile";
import { setupTestDatabase, cleanupTestDatabase } from "~/tests/utils/testDb";

describe("/api/auth/profile", () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  describe("GET /api/auth/profile", () => {
    test("認証済みユーザーは自分のプロフィールを取得できる", async () => {
      const request = createRequest("GET", "/api/auth/profile", {
        userId: "user_123",
      });

      const response = await loader({ request });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.user_id).toBe("user_123");
      expect(data.data.roles).toBeDefined();
    });

    test("未認証ユーザーは401エラーを受け取る", async () => {
      const request = createRequest("GET", "/api/auth/profile");

      const response = await loader({ request });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("PUT /api/auth/profile", () => {
    test("認証済みユーザーは自分のプロフィールを更新できる", async () => {
      const request = createRequest("PUT", "/api/auth/profile", {
        userId: "user_123",
        body: {
          username: "new_username",
          full_name: "新しい名前",
        },
      });

      const response = await action({ request });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.username).toBe("new_username");
    });

    test("不正なフィールドは無視される", async () => {
      const request = createRequest("PUT", "/api/auth/profile", {
        userId: "user_123",
        body: {
          username: "new_username",
          role_id: 3, // 不正なフィールド
          is_active: false, // 不正なフィールド
        },
      });

      const response = await action({ request });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.username).toBe("new_username");
      // role_idやis_activeは更新されていないことを確認
    });
  });
});
```

### 2. **権限制御の統合テスト**

```typescript
// tests/integration/permissions.test.ts
import { describe, test, expect } from "vitest";
import { createRequest } from "~/tests/utils/mockRequest";
import { loader as adminUsersLoader } from "~/routes/api/admin/users";
import { loader as profileLoader } from "~/routes/api/auth/profile";

describe("権限制御統合テスト", () => {
  test("一般ユーザーは管理者APIにアクセスできない", async () => {
    const request = createRequest("GET", "/api/admin/users", {
      userId: "user_123",
      role: "user",
    });

    const response = await adminUsersLoader({ request });
    expect(response.status).toBe(403);
  });

  test("管理者は管理者APIにアクセスできる", async () => {
    const request = createRequest("GET", "/api/admin/users", {
      userId: "admin_123",
      role: "admin",
    });

    const response = await adminUsersLoader({ request });
    expect(response.status).toBe(200);
  });

  test("モデレーターは一部の管理者APIにアクセスできる", async () => {
    const request = createRequest("GET", "/api/admin/users", {
      userId: "mod_123",
      role: "moderator",
    });

    const response = await adminUsersLoader({ request });
    expect(response.status).toBe(200); // users.read権限があるため
  });

  test("ユーザーは自分のプロフィールのみアクセスできる", async () => {
    // 自分のプロフィール
    const selfRequest = createRequest("GET", "/api/auth/profile", {
      userId: "user_123",
    });
    const selfResponse = await profileLoader({ selfRequest });
    expect(selfResponse.status).toBe(200);

    // 他人のプロフィール（このAPIでは対象外だが、概念的に）
    // 実際のテストは /api/admin/users/:userId で行う
  });
});
```

## 🎭 E2Eテスト (End-to-End Tests)

### 1. **Playwrightを使ったE2Eテスト**

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from "@playwright/test";
import { loginAsUser, loginAsAdmin } from "./utils/auth";

test.describe("認証・権限制御", () => {
  test("一般ユーザーでログインして権限に応じた画面が表示される", async ({
    page,
  }) => {
    await loginAsUser(page, "user@example.com");

    // ダッシュボードに移動
    await page.goto("/dashboard");
    await expect(page.locator("h1")).toContainText("ダッシュボード");

    // 管理者メニューが表示されないことを確認
    await expect(page.locator('[data-testid="admin-menu"]')).not.toBeVisible();

    // 一般ユーザー向け機能が表示されることを確認
    await expect(
      page.locator('[data-testid="user-profile-link"]'),
    ).toBeVisible();
  });

  test("管理者でログインして管理者機能にアクセスできる", async ({ page }) => {
    await loginAsAdmin(page, "admin@example.com");

    // 管理者ダッシュボードに移動
    await page.goto("/admin");
    await expect(page.locator("h1")).toContainText("管理者ダッシュボード");

    // 管理者メニューが表示されることを確認
    await expect(page.locator('[data-testid="admin-menu"]')).toBeVisible();

    // ユーザー管理ページにアクセス
    await page.click('[data-testid="users-management-link"]');
    await expect(page.locator("h1")).toContainText("ユーザー管理");

    // ユーザー一覧が表示されることを確認
    await expect(page.locator('[data-testid="users-table"]')).toBeVisible();
  });

  test("権限のないページにアクセスすると適切なエラーが表示される", async ({
    page,
  }) => {
    await loginAsUser(page, "user@example.com");

    // 管理者ページに直接アクセス
    await page.goto("/admin");

    // 権限エラーが表示されることを確認
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      "権限が不足しています",
    );

    // ホームページへのリンクが表示されることを確認
    await expect(page.locator('[data-testid="back-to-home"]')).toBeVisible();
  });
});
```

### 2. **ユーザーフローのテスト**

```typescript
// tests/e2e/user-management.spec.ts
import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./utils/auth";

test.describe("ユーザー管理フロー", () => {
  test("管理者がユーザーのロールを変更できる", async ({ page }) => {
    await loginAsAdmin(page, "admin@example.com");

    // ユーザー管理ページに移動
    await page.goto("/admin/users");

    // 特定のユーザーを検索
    await page.fill('[data-testid="user-search"]', "test_user");
    await page.click('[data-testid="search-button"]');

    // ユーザーが見つかることを確認
    await expect(page.locator('[data-testid="user-row"]')).toBeVisible();

    // 編集ボタンをクリック
    await page.click('[data-testid="edit-user-button"]');

    // モーダルが開くことを確認
    await expect(page.locator('[data-testid="edit-user-modal"]')).toBeVisible();

    // ロールを変更
    await page.selectOption('[data-testid="role-select"]', "moderator");

    // 保存ボタンをクリック
    await page.click('[data-testid="save-button"]');

    // 成功メッセージが表示されることを確認
    await expect(page.locator('[data-testid="success-message"]')).toContainText(
      "ユーザー情報を更新しました",
    );

    // ユーザー一覧でロールが更新されていることを確認
    await expect(page.locator('[data-testid="user-role-badge"]')).toContainText(
      "モデレーター",
    );
  });

  test("権限のない操作はボタンが無効化される", async ({ page }) => {
    // モデレーターでログイン（ユーザー削除権限なし）
    await loginAsModerator(page, "mod@example.com");

    await page.goto("/admin/users");

    // 削除ボタンが無効化されていることを確認
    await expect(
      page.locator('[data-testid="delete-user-button"]'),
    ).toBeDisabled();

    // 編集ボタンは有効であることを確認
    await expect(
      page.locator('[data-testid="edit-user-button"]'),
    ).toBeEnabled();
  });
});
```

## 🛡️ セキュリティテスト

### 1. **権限昇格攻撃のテスト**

```typescript
// tests/security/privilege-escalation.test.ts
import { describe, test, expect } from "vitest";
import { createRequest } from "~/tests/utils/mockRequest";
import { action as updateUserAction } from "~/routes/api/admin/users/$userId";

describe("権限昇格攻撃の防止", () => {
  test("一般ユーザーが自分のロールを管理者に変更しようとしても失敗する", async () => {
    const request = createRequest("PUT", "/api/admin/users/user_123", {
      userId: "user_123", // 自分自身
      role: "user",
      body: {
        role_id: 3, // 管理者ロールに変更しようとする
      },
    });

    const response = await updateUserAction({
      request,
      params: { userId: "user_123" },
    });

    expect(response.status).toBe(403);
  });

  test("一般ユーザーが他人のロールを変更しようとしても失敗する", async () => {
    const request = createRequest("PUT", "/api/admin/users/other_user", {
      userId: "user_123",
      role: "user",
      body: {
        role_id: 2, // モデレーターロール
      },
    });

    const response = await updateUserAction({
      request,
      params: { userId: "other_user" },
    });

    expect(response.status).toBe(403);
  });

  test("管理者は他人のロールを変更できる", async () => {
    const request = createRequest("PUT", "/api/admin/users/user_123", {
      userId: "admin_123",
      role: "admin",
      body: {
        role_id: 2, // モデレーターロール
      },
    });

    const response = await updateUserAction({
      request,
      params: { userId: "user_123" },
    });

    expect(response.status).toBe(200);
  });
});
```

### 2. **SQLインジェクション対策のテスト**

```typescript
// tests/security/sql-injection.test.ts
import { describe, test, expect } from "vitest";
import { createRequest } from "~/tests/utils/mockRequest";
import { loader as usersLoader } from "~/routes/api/admin/users";

describe("SQLインジェクション対策", () => {
  test("検索パラメータにSQLインジェクションを試みても安全", async () => {
    const maliciousInput = "'; DROP TABLE profiles; --";

    const request = createRequest(
      "GET",
      `/api/admin/users?search=${encodeURIComponent(maliciousInput)}`,
      {
        userId: "admin_123",
        role: "admin",
      },
    );

    // エラーが発生せず、適切に処理されることを確認
    const response = await usersLoader({ request });
    expect(response.status).toBe(200);

    // データベースが破損していないことを確認
    const { data } = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("ロールフィルターにSQLインジェクションを試みても安全", async () => {
    const maliciousInput = "admin' OR '1'='1";

    const request = createRequest(
      "GET",
      `/api/admin/users?role=${encodeURIComponent(maliciousInput)}`,
      {
        userId: "admin_123",
        role: "admin",
      },
    );

    const response = await usersLoader({ request });
    expect(response.status).toBe(200);

    // 不正なデータが返されていないことを確認
    const { data } = await response.json();
    expect(data.length).toBe(0); // 存在しないロールなので0件
  });
});
```

## 🏗️ テストユーティリティ

### 1. **テストデータの準備**

```typescript
// tests/utils/testData.ts
export const testUsers = {
  admin: {
    id: "admin_123",
    user_id: "admin_123",
    email: "admin@example.com",
    username: "admin",
    full_name: "管理者",
    role_id: 3,
    roles: {
      id: 3,
      code: "admin",
      name: "管理者",
      permission_level: 10,
    },
  },
  moderator: {
    id: "mod_123",
    user_id: "mod_123",
    email: "mod@example.com",
    username: "moderator",
    full_name: "モデレーター",
    role_id: 2,
    roles: {
      id: 2,
      code: "moderator",
      name: "モデレーター",
      permission_level: 5,
    },
  },
  user: {
    id: "user_123",
    user_id: "user_123",
    email: "user@example.com",
    username: "user",
    full_name: "一般ユーザー",
    role_id: 1,
    roles: {
      id: 1,
      code: "user",
      name: "一般ユーザー",
      permission_level: 1,
    },
  },
};

export const testPermissions = [
  { id: 1, code: "profile.read", name: "プロフィール閲覧" },
  { id: 2, code: "profile.update", name: "プロフィール更新" },
  { id: 3, code: "users.read", name: "ユーザー一覧閲覧" },
  { id: 4, code: "users.update", name: "ユーザー情報更新" },
  { id: 5, code: "users.delete", name: "ユーザー削除" },
];

export async function seedTestData() {
  // テストデータをデータベースに挿入
  await supabase.from("roles").insert([
    { id: 1, code: "user", name: "一般ユーザー", permission_level: 1 },
    { id: 2, code: "moderator", name: "モデレーター", permission_level: 5 },
    { id: 3, code: "admin", name: "管理者", permission_level: 10 },
  ]);

  await supabase.from("permissions").insert(testPermissions);

  await supabase
    .from("profiles")
    .insert([testUsers.admin, testUsers.moderator, testUsers.user]);
}

export async function cleanupTestData() {
  // テストデータを削除
  await supabase.from("profiles").delete().neq("id", "");
  await supabase.from("permissions").delete().neq("id", "");
  await supabase.from("roles").delete().neq("id", "");
}
```

### 2. **モックヘルパー**

```typescript
// tests/utils/mockRequest.ts
export function createRequest(
  method: string,
  url: string,
  options: {
    userId?: string;
    role?: string;
    body?: any;
    headers?: Record<string, string>;
  } = {},
): Request {
  const { userId, role, body, headers = {} } = options;

  // 認証情報をヘッダーに設定
  if (userId) {
    headers["Authorization"] = `Bearer mock_token_${userId}`;
  }

  const request = new Request(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // Clerkの認証情報をモック
  if (userId && role) {
    (request as any).auth = {
      userId,
      sessionClaims: { role },
    };
  }

  return request;
}
```

## 🚀 CI/CDでの自動テスト

### 1. **GitHub Actionsの設定**

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Setup test database
        run: |
          npm run db:migrate:test
          npm run db:seed:test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db

      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: |
            coverage/
            test-results/
```

### 2. **テストコマンドの設定**

```json
// package.json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "playwright test",
    "test:security": "vitest run tests/security",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest",
    "db:migrate:test": "supabase db reset --db-url $DATABASE_URL",
    "db:seed:test": "node scripts/seed-test-data.js"
  }
}
```

## 📊 テストカバレッジとレポート

### 1. **カバレッジ設定**

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "tests/", "*.config.*", "build/"],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        // 権限関連は特に高いカバレッジを要求
        "lib/auth/": {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95,
        },
      },
    },
  },
});
```

## 🤔 よくある質問

### Q1: どの程度のテストカバレッジが必要？

**A:**

- **権限システム**: 95%以上（セキュリティ重要）
- **一般的な機能**: 80%以上
- **UI コンポーネント**: 70%以上

### Q2: E2Eテストが遅い場合の対策は？

**A:**

- 並列実行の活用
- 重要なフローに絞る
- ヘッドレスブラウザの使用
- CI環境での最適化

### Q3: テストデータの管理方法は？

**A:**

- テスト用データベースの使用
- 各テスト前後のクリーンアップ
- ファクトリーパターンの活用
- シード データの自動化

### Q4: 権限変更時のテスト更新は？

**A:**

- 権限マトリックスの文書化
- テストケースの体系的な整理
- 自動テスト生成の検討

---

**前へ**: [フロントエンド実装](./07-frontend-implementation.md) ←  
**次へ**: [デプロイメント](./09-deployment.md) →
