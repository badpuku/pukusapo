# セキュリティ - 安全なロール機能を実現する

## 🎯 この章で学ぶこと

- セキュリティの基本原則
- 具体的な脅威と対策
- RLSポリシーの詳細
- セキュリティテストの方法

## 🛡️ セキュリティの基本原則

### 1. **多層防御（Defense in Depth）**

```
🏰 城の防御のように複数の層で守る

外堀 → 内堀 → 城壁 → 天守閣
  ↓      ↓      ↓      ↓
UI   → API  → DB   → データ
```

#### 実装例

```typescript
// ❌ 悪い例：1層のみの防御
function AdminPanel() {
  const { user } = useAuth();

  // フロントエンドのみでチェック
  if (user.role !== "admin") return <div>権限がありません</div>;

  return <AdminContent />; // APIレベルでのチェックなし
}

// ✅ 良い例：多層防御
function AdminPanel() {
  const { hasPermission, loading } = usePermission("admin.access");

  // 1層目：フロントエンドでのチェック
  if (loading) return <div>Loading...</div>;
  if (!hasPermission) return <div>権限がありません</div>;

  return <AdminContent />; // 2層目：APIでも権限チェック実施
}

// API側での2層目防御
export async function getAdminData() {
  // 2層目：APIレベルでのチェック
  await requirePermission("admin.access");

  // 3層目：RLSによりDBレベルでも自動チェック
  return await db.query("SELECT * FROM admin_data");
}
```

### 2. **最小権限の原則（Principle of Least Privilege）**

```typescript
// ❌ 悪い例：過度な権限付与
const moderatorPermissions = [
  "content.read",
  "content.update",
  "content.delete",
  "users.delete", // 不要：ユーザー削除は管理者のみ
  "system.settings", // 危険：システム設定は管理者のみ
  "backup.create", // 不要：バックアップは管理者のみ
];

// ✅ 良い例：必要最小限の権限
const moderatorPermissions = [
  "content.read",
  "content.update",
  "content.moderate", // コンテンツの承認・拒否のみ
  "users.read", // ユーザー一覧の閲覧のみ
];
```

### 3. **ゼロトラスト（Zero Trust）**

```typescript
// すべてのリクエストで権限を確認
export async function updateProfile(userId: string, data: ProfileData) {
  // 毎回権限をチェック（セッションを信用しない）
  const currentUser = await getCurrentUser();

  // 自分のプロフィール or 管理者権限をチェック
  if (currentUser.id !== userId) {
    await requirePermission("users.update");
  }

  return await updateUserProfile(userId, data);
}
```

## 🚨 具体的な脅威と対策

### 1. **権限昇格攻撃**

#### 脅威の例

```typescript
// 攻撃者が一般ユーザーから管理者に昇格しようとする
const maliciousRequest = {
  userId: "user_123",
  roleId: 3, // 管理者ロールに変更しようとする
};
```

#### 対策

```sql
-- RLSポリシーで防御
CREATE POLICY "profiles_role_update_policy" ON profiles
  FOR UPDATE USING (
    -- 自分のロール変更は禁止
    user_id != auth.uid()::text AND
    -- 管理者のみがロール変更可能
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.user_id = auth.uid()::text
      AND r.code = "admin"
      AND p.is_active = true
    )
  );
```

```typescript
// アプリケーションレベルでも防御
export async function updateUserRole(userId: string, newRoleId: number) {
  const currentUser = await getCurrentUser();

  // 自分のロールは変更できない
  if (currentUser.id === userId) {
    throw new Error("自分のロールは変更できません");
  }

  // 管理者権限が必要
  await requirePermission("users.update_role");

  return await updateRole(userId, newRoleId);
}
```

### 2. **SQLインジェクション**

#### 脅威の例

```typescript
// ❌ 危険：SQLインジェクションの可能性
export async function getUsersByRole(roleCode: string) {
  // 直接文字列を結合（危険）
  const query = `SELECT * FROM profiles p 
                 JOIN roles r ON p.role_id = r.id 
                 WHERE r.code = '${roleCode}'`;

  return await db.query(query);
}

// 攻撃例：roleCode = "admin'; DROP TABLE profiles; --"
```

#### 対策

```typescript
// ✅ 安全：パラメータ化クエリを使用
export async function getUsersByRole(roleCode: string) {
  const query = `
    SELECT p.*, r.code, r.name 
    FROM profiles p 
    JOIN roles r ON p.role_id = r.id 
    WHERE r.code = $1 AND p.is_active = true
  `;

  return await db.query(query, [roleCode]);
}

// または、ORMを使用
export async function getUsersByRoleORM(roleCode: string) {
  return await supabase
    .from("profiles")
    .select(
      `
      *,
      roles (
        code,
        name
      )
    `,
    )
    .eq("roles.code", roleCode)
    .eq("is_active", true);
}
```

### 3. **セッションハイジャック**

#### 脅威の例

```typescript
// 攻撃者が他人のセッションを乗っ取る
// 例：XSSでJWTトークンを盗む
```

#### 対策

```typescript
// セッションの定期的な検証
export async function validateSession(token: string) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // トークンの有効期限チェック
    if (decoded.exp < Date.now() / 1000) {
      throw new Error("トークンが期限切れです");
    }

    // ユーザーの状態チェック
    const user = await getUserById(decoded.sub);
    if (!user || !user.is_active) {
      throw new Error("無効なユーザーです");
    }

    return user;
  } catch (error) {
    throw new Error("認証に失敗しました");
  }
}

// 重要な操作では再認証を要求
export async function deleteUser(userId: string, password: string) {
  // 現在のユーザーのパスワードを再確認
  await verifyCurrentUserPassword(password);

  await requirePermission("users.delete");
  return await performDeleteUser(userId);
}
```

## 🔐 RLSポリシーの詳細設計

### 1. **段階的な権限制御**

```sql
-- レベル1：自分のデータのみアクセス可能
CREATE POLICY "profiles_self_access" ON profiles
  FOR ALL USING (user_id = auth.uid()::text);

-- レベル2：モデレーター以上は他ユーザーの基本情報を閲覧可能
CREATE POLICY "profiles_moderator_read" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.user_id = auth.uid()::text
      AND r.permission_level >= 5
      AND p.is_active = true
      AND r.is_active = true
    )
  );

-- レベル3：管理者のみ全ての操作が可能
CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.user_id = auth.uid()::text
      AND r.code = "admin"
      AND p.is_active = true
      AND r.is_active = true
    )
  );
```

### 2. **時間ベースの権限制御**

```sql
-- 営業時間内のみアクセス可能
CREATE POLICY "business_hours_policy" ON sensitive_data
  FOR ALL USING (
    EXTRACT(hour FROM now()) BETWEEN 9 AND 17 AND
    EXTRACT(dow FROM now()) BETWEEN 1 AND 5 AND -- 月〜金
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.user_id = auth.uid()::text
      AND r.permission_level >= 5
    )
  );
```

### 3. **IP制限ポリシー**

```sql
-- 特定のIPアドレスからのみアクセス可能
CREATE POLICY "ip_restriction_policy" ON admin_data
  FOR ALL USING (
    inet_client_addr() << inet "192.168.1.0/24" AND -- 社内IPのみ
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.user_id = auth.uid()::text
      AND r.code = "admin"
    )
  );
```

## 🧪 セキュリティテストの実装

### 1. **権限チェックのテスト**

```typescript
describe("権限チェックテスト", () => {
  test("一般ユーザーは管理者機能にアクセスできない", async () => {
    // 一般ユーザーでログイン
    const userToken = await loginAsUser("test_user");

    // 管理者機能へのアクセスを試行
    const response = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("権限がありません");
  });

  test("管理者は全ての機能にアクセスできる", async () => {
    const adminToken = await loginAsAdmin("test_admin");

    const response = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.users).toBeDefined();
  });

  test("権限昇格攻撃を防ぐ", async () => {
    const userToken = await loginAsUser("test_user");

    // 自分のロールを管理者に変更しようとする
    const response = await request(app)
      .put("/api/users/test_user/role")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ roleId: 3 }); // 管理者ロール

    expect(response.status).toBe(403);
  });
});
```

### 2. **RLSポリシーのテスト**

```sql
-- テスト用の関数
CREATE OR REPLACE FUNCTION test_rls_policy(
  test_user_id text,
  test_role_code text
) RETURNS TABLE(can_access boolean) AS $$
BEGIN
  -- テストユーザーとして認証をシミュレート
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', test_user_id)::text, true);

  -- テストユーザーのロールを設定
  UPDATE profiles SET role_id = (
    SELECT id FROM roles WHERE code = test_role_code
  ) WHERE user_id = test_user_id;

  -- アクセステストを実行
  RETURN QUERY
  SELECT EXISTS(
    SELECT 1 FROM profiles WHERE user_id != test_user_id
  ) as can_access;
END;
$$ LANGUAGE plpgsql;

-- テスト実行
SELECT * FROM test_rls_policy("test_user", "user");     -- false期待
SELECT * FROM test_rls_policy("test_admin", "admin");   -- true期待
```

### 3. **ペネトレーションテスト**

```typescript
describe("ペネトレーションテスト", () => {
  test("SQLインジェクション攻撃", async () => {
    const maliciousInput = "admin'; DROP TABLE profiles; --";

    const response = await request(app)
      .get(`/api/users/role/${maliciousInput}`)
      .set("Authorization", `Bearer ${validToken}`);

    // エラーが返されることを確認（テーブルが削除されないこと）
    expect(response.status).toBe(400);

    // テーブルが存在することを確認
    const tableCheck = await db.query(
      "SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles'",
    );
    expect(tableCheck.rows.length).toBe(1);
  });

  test("XSS攻撃", async () => {
    const xssPayload = "<script>alert('xss')</script>";

    const response = await request(app)
      .put("/api/users/profile")
      .set("Authorization", `Bearer ${validToken}`)
      .send({ full_name: xssPayload });

    // エスケープされていることを確認
    expect(response.body.full_name).not.toContain("<script>");
  });
});
```

## 🔍 セキュリティ監査とモニタリング

### 1. **アクセスログの記録**

```typescript
// 重要な操作をログに記録
export async function auditLog(
  userId: string,
  action: string,
  resource: string,
  details?: any,
) {
  await db.query(
    `
    INSERT INTO audit_logs (
      user_id, action, resource, details, ip_address, user_agent, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, now())
  `,
    [
      userId,
      action,
      resource,
      JSON.stringify(details),
      getClientIP(),
      getUserAgent(),
    ],
  );
}

// 使用例
export async function deleteUser(userId: string) {
  await requirePermission("users.delete");

  // 削除前にログを記録
  await auditLog(getCurrentUserId(), "DELETE_USER", "users", {
    deletedUserId: userId,
  });

  return await performDeleteUser(userId);
}
```

### 2. **異常検知**

```sql
-- 短時間での大量アクセスを検知
WITH recent_access AS (
  SELECT
    user_id,
    COUNT(*) as access_count
  FROM audit_logs
  WHERE created_at > now() - interval '1 hour'
    AND action IN ('DELETE_USER', 'UPDATE_ROLE', 'ADMIN_ACCESS')
  GROUP BY user_id
)
SELECT
  p.username,
  ra.access_count,
  'SUSPICIOUS_ACTIVITY' as alert_type
FROM recent_access ra
JOIN profiles p ON ra.user_id = p.user_id
WHERE ra.access_count > 10; -- 1時間に10回以上の重要操作
```

### 3. **定期的なセキュリティチェック**

```sql
-- 権限の定期監査クエリ
-- 1. 非アクティブユーザーの権限確認
SELECT
  p.username,
  p.user_id,
  r.code as role_code,
  p.created_at,
  'INACTIVE_USER_WITH_PERMISSIONS' as issue
FROM profiles p
JOIN roles r ON p.role_id = r.id
WHERE p.is_active = false
  AND r.code IN ('admin', 'moderator');

-- 2. 長期間ログインしていない管理者
SELECT
  p.username,
  p.user_id,
  r.code as role_code,
  MAX(al.created_at) as last_login,
  'DORMANT_ADMIN_ACCOUNT' as issue
FROM profiles p
JOIN roles r ON p.role_id = r.id
LEFT JOIN audit_logs al ON p.user_id = al.user_id
WHERE r.code = 'admin'
GROUP BY p.username, p.user_id, r.code
HAVING MAX(al.created_at) < now() - interval '30 days'
   OR MAX(al.created_at) IS NULL;

-- 3. 異常な権限組み合わせ
SELECT
  p.username,
  r.code as role_code,
  COUNT(rp.permission_id) as permission_count,
  'EXCESSIVE_PERMISSIONS' as issue
FROM profiles p
JOIN roles r ON p.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY p.username, r.code
HAVING COUNT(rp.permission_id) > 15; -- 15個以上の権限
```

## 🚨 インシデント対応

### 1. **セキュリティインシデント発生時の対応**

```typescript
// 緊急時のアカウント無効化
export async function emergencyDisableUser(
  userId: string,
  reason: string,
  disabledBy: string,
) {
  // 即座にアカウントを無効化
  await db.query(
    `
    UPDATE profiles 
    SET is_active = false, 
        disabled_reason = $2,
        disabled_by = $3,
        disabled_at = now()
    WHERE user_id = $1
  `,
    [userId, reason, disabledBy],
  );

  // セッションを無効化
  await invalidateAllUserSessions(userId);

  // 緊急ログを記録
  await auditLog(disabledBy, "EMERGENCY_DISABLE", "users", {
    disabledUserId: userId,
    reason: reason,
  });

  // 管理者に通知
  await notifyAdmins("SECURITY_INCIDENT", {
    action: "User disabled",
    userId: userId,
    reason: reason,
  });
}
```

### 2. **ロールバック機能**

```sql
-- 権限変更履歴テーブル
CREATE TABLE role_change_history (
  id bigserial PRIMARY KEY,
  user_id text NOT NULL,
  old_role_id bigint,
  new_role_id bigint,
  changed_by text NOT NULL,
  changed_at timestamptz DEFAULT now(),
  reason text
);

-- ロールバック関数
CREATE OR REPLACE FUNCTION rollback_role_change(
  target_user_id text,
  rollback_to_timestamp timestamptz
) RETURNS void AS $$
DECLARE
  old_role_record RECORD;
BEGIN
  -- 指定時点での最新のロールを取得
  SELECT old_role_id INTO old_role_record
  FROM role_change_history
  WHERE user_id = target_user_id
    AND changed_at <= rollback_to_timestamp
  ORDER BY changed_at DESC
  LIMIT 1;

  -- ロールを復元
  UPDATE profiles
  SET role_id = old_role_record.old_role_id
  WHERE user_id = target_user_id;

  -- 履歴に記録
  INSERT INTO role_change_history (user_id, old_role_id, new_role_id, changed_by, reason)
  VALUES (target_user_id,
          (SELECT role_id FROM profiles WHERE user_id = target_user_id),
          old_role_record.old_role_id,
          'system',
          'Security rollback');
END;
$$ LANGUAGE plpgsql;
```

## 🤔 よくある質問

### Q1: RLSだけで十分ですか？

**A:** いいえ。RLSは強力ですが、アプリケーションレベルでの検証も必要です。多層防御が重要です。

### Q2: 権限チェックのパフォーマンスが心配です

**A:**

- 適切なインデックス設計
- 権限情報のキャッシュ
- ビューを使った最適化
  で解決できます。

### Q3: セキュリティテストはどの程度必要？

**A:**

- 基本的な権限チェック：必須
- RLSポリシーテスト：推奨
- ペネトレーションテスト：本番環境では必須

### Q4: 監査ログはどの程度保持すべき？

**A:**

- 法的要件：業界により異なる
- 推奨：最低1年、重要な操作は3年以上
- 容量とコストを考慮してアーカイブ戦略を策定

---

**前へ**: [マイグレーション](./04-migration-guide.md) ←  
**次へ**: [API実装](./06-api-implementation.md) →
