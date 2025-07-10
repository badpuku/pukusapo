# 権限の仕組み - どのように権限が動作するか

## 🎯 この章で学ぶこと

- 権限チェックの流れ
- RLS（行レベルセキュリティ）とは
- 実際のコード例
- セキュリティのポイント

## 🔄 権限チェックの全体フロー

```
🚪 ユーザーがアクションを実行しようとする
    ↓
🔍 1. ユーザー認証（Clerk）
    ↓
👤 2. ユーザー情報を取得（profiles テーブル）
    ↓
🎭 3. ロール情報を取得（roles テーブル）
    ↓
🔑 4. 権限情報を取得（permissions テーブル）
    ↓
✅ 5. 権限チェック実行
    ↓
🎯 6. アクション実行 or エラー
```

## 🔍 詳細な権限チェックプロセス

### 1. ユーザー認証

```typescript
// Clerkによる認証
const { userId } = await auth();
if (!userId) {
  throw new Error("認証が必要です");
}
```

### 2. ユーザー情報取得

```sql
-- プロフィール情報とロールを同時取得
SELECT
  p.user_id,
  p.username,
  r.code as role_code,
  r.permission_level
FROM profiles p
JOIN roles r ON p.role_id = r.id
WHERE p.user_id = 'clerk_123'
  AND p.is_active = true
  AND r.is_active = true;
```

### 3. 権限チェック

```typescript
// 具体的な権限チェック関数
async function hasPermission(
  userId: string,
  permissionCode: string,
): Promise<boolean> {
  const result = await db.query(
    `
    SELECT 1
    FROM profiles p
    JOIN roles r ON p.role_id = r.id
    JOIN role_permissions rp ON r.id = rp.role_id
    JOIN permissions perm ON rp.permission_id = perm.id
    WHERE p.user_id = $1
      AND perm.code = $2
      AND p.is_active = true
      AND r.is_active = true
      AND perm.is_active = true
  `,
    [userId, permissionCode],
  );

  return result.rows.length > 0;
}
```

## 🛡️ RLS（Row Level Security）とは

**RLS**は「行レベルセキュリティ」の略で、**データベースレベルで自動的に権限制御**を行う仕組みです。

### 🔒 RLSがない場合の問題

```typescript
// ❌ 危険：すべてのユーザー情報が取得できてしまう
const allUsers = await db.query("SELECT * FROM profiles");
// → 他人の個人情報も見えてしまう！
```

### ✅ RLSがある場合の安全性

```sql
-- RLSポリシーの例
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT USING (
    user_id = auth.uid()::text OR  -- 自分のデータ
    EXISTS (                       -- または管理者権限
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.user_id = auth.uid()::text
      AND r.permission_level >= 10
    )
  );
```

```typescript
// ✅ 安全：RLSにより自動的にフィルタリング
const users = await db.query("SELECT * FROM profiles");
// → 自分のデータ or 管理者なら全データ
```

## 📋 実際のRLSポリシー例

### 1. プロフィールテーブルのポリシー

```sql
-- 閲覧ポリシー：自分 or 管理者のみ
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT USING (
    user_id = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.user_id = auth.uid()::text
      AND r.permission_level >= 10
      AND p.is_active = true
      AND r.is_active = true
    )
  );

-- 更新ポリシー：自分 or 管理者のみ
CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE USING (
    user_id = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.user_id = auth.uid()::text
      AND r.permission_level >= 10
      AND p.is_active = true
      AND r.is_active = true
    )
  );
```

### 2. ロールテーブルのポリシー

```sql
-- 閲覧ポリシー：全員が閲覧可能
CREATE POLICY "roles_select_policy" ON roles
  FOR SELECT USING (is_active = true);

-- 編集ポリシー：管理者のみ
CREATE POLICY "roles_modify_policy" ON roles
  FOR ALL WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.user_id = auth.uid()::text
      AND r.code = 'admin'
      AND p.is_active = true
      AND r.is_active = true
    )
  );
```

## 🎮 実際の使用例

### 例1: ユーザー削除機能

```typescript
// ユーザー削除API
export async function deleteUser(userId: string) {
  // 1. 現在のユーザーを取得
  const currentUser = await getCurrentUser();

  // 2. 権限チェック
  const canDeleteUsers = await hasPermission(currentUser.id, "users.delete");

  if (!canDeleteUsers) {
    throw new Error("ユーザーを削除する権限がありません");
  }

  // 3. 削除実行（RLSにより追加の安全性確保）
  await db.query("DELETE FROM profiles WHERE user_id = $1", [userId]);
}
```

### 例2: 管理画面へのアクセス

```typescript
// 管理画面のアクセス制御
export async function requireAdminAccess() {
  const user = await getCurrentUser();

  // レベルベースの権限チェック
  if (user.role.permission_level < 10) {
    throw new Response("管理者権限が必要です", { status: 403 });
  }

  return user;
}

// 使用例
export async function adminDashboard() {
  await requireAdminAccess(); // 権限チェック

  // 管理画面のデータを取得
  const stats = await getSystemStats();
  return stats;
}
```

### 例3: 段階的な権限チェック

```typescript
// モデレーター機能：コンテンツ管理
export async function moderateContent(contentId: string, action: string) {
  const user = await getCurrentUser();

  // 1. 基本的な権限チェック
  const canModerate = await hasPermission(user.id, "content.moderate");

  if (!canModerate) {
    throw new Error("コンテンツを管理する権限がありません");
  }

  // 2. アクション別の詳細チェック
  switch (action) {
    case "delete":
      // 削除は管理者のみ
      if (user.role.permission_level < 10) {
        throw new Error("削除は管理者のみ実行できます");
      }
      break;

    case "hide":
      // 非表示はモデレーター以上
      if (user.role.permission_level < 5) {
        throw new Error("モデレーター権限が必要です");
      }
      break;
  }

  // 3. アクション実行
  await executeContentAction(contentId, action);
}
```

## 🔧 権限チェック用のユーティリティ関数

### 1. 基本的な権限チェック

```typescript
// 特定の権限を持っているかチェック
export async function hasPermission(
  userId: string,
  permissionCode: string,
): Promise<boolean> {
  const result = await supabase
    .from("v_user_permissions") // ビューを使用
    .select("permission_code")
    .eq("user_id", userId)
    .eq("permission_code", permissionCode)
    .single();

  return !!result.data;
}

// 複数の権限をチェック
export async function hasAnyPermission(
  userId: string,
  permissionCodes: string[],
): Promise<boolean> {
  const result = await supabase
    .from("v_user_permissions")
    .select("permission_code")
    .eq("user_id", userId)
    .in("permission_code", permissionCodes);

  return result.data && result.data.length > 0;
}
```

### 2. ロールベースのチェック

```typescript
// 特定のロールを持っているかチェック
export async function hasRole(
  userId: string,
  roleCode: string,
): Promise<boolean> {
  const result = await supabase
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

  return result.data?.roles?.code === roleCode;
}

// 権限レベルベースのチェック
export async function hasMinimumLevel(
  userId: string,
  minimumLevel: number,
): Promise<boolean> {
  const result = await supabase
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

  return (result.data?.roles?.permission_level || 0) >= minimumLevel;
}
```

### 3. React Hookでの権限チェック

```typescript
// カスタムフック
export function usePermission(permissionCode: string) {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setHasPermission(false);
      setLoading(false);
      return;
    }

    checkPermission(user.id, permissionCode)
      .then(setHasPermission)
      .finally(() => setLoading(false));
  }, [user, permissionCode]);

  return { hasPermission, loading };
}

// 使用例
function DeleteButton({ userId }: { userId: string }) {
  const { hasPermission, loading } = usePermission('users.delete');

  if (loading) return <div>Loading...</div>;
  if (!hasPermission) return null;

  return (
    <button onClick={() => deleteUser(userId)}>
      削除
    </button>
  );
}
```

## 🚨 セキュリティのベストプラクティス

### 1. **多層防御**

```typescript
// ❌ 悪い例：フロントエンドのみでチェック
function AdminButton() {
  const { user } = useAuth();

  if (user.role !== 'admin') return null;

  return <button onClick={deleteAllUsers}>全削除</button>;
  // → APIレベルでのチェックなし！
}

// ✅ 良い例：多層でチェック
function AdminButton() {
  const { hasPermission } = usePermission('users.delete');

  if (!hasPermission) return null;

  return (
    <button onClick={async () => {
      // APIでも再度権限チェックされる
      await deleteUser(userId);
    }}>
      削除
    </button>
  );
}
```

### 2. **最小権限の原則**

```typescript
// ❌ 悪い例：過度な権限
const userPermissions = [
  "users.create",
  "users.read",
  "users.update",
  "users.delete", // 一般ユーザーには不要
  "system.admin", // 一般ユーザーには危険
];

// ✅ 良い例：必要最小限
const userPermissions = ["profile.read", "profile.update", "content.read"];
```

### 3. **権限の定期的な見直し**

```sql
-- 使われていない権限の確認
SELECT p.code, p.name
FROM permissions p
LEFT JOIN role_permissions rp ON p.id = rp.permission_id
WHERE rp.permission_id IS NULL;

-- 過度な権限を持つユーザーの確認
SELECT
  prof.username,
  r.code as role_code,
  COUNT(rp.permission_id) as permission_count
FROM profiles prof
JOIN roles r ON prof.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY prof.username, r.code
HAVING COUNT(rp.permission_id) > 10;
```

## 🤔 よくある質問

### Q1: RLSとアプリケーションレベルの権限チェックの違いは？

**A:**

- **RLS**: データベースレベルで自動的に制御
- **アプリケーションレベル**: コードで明示的に制御
- **両方使用**: より安全な多層防御

### Q2: 権限チェックのパフォーマンスは大丈夫？

**A:**

- インデックスにより高速化
- ビューを使用してクエリを最適化
- キャッシュ機能も実装可能

### Q3: 権限が変更された時はどうなる？

**A:**

- 次回ログイン時に新しい権限が適用
- リアルタイム更新も実装可能
- セッション管理で即座に反映

---

**前へ**: [データベース設計](./02-database-design.md) ←  
**次へ**: [マイグレーション](./04-migration-guide.md) →
