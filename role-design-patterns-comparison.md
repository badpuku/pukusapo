# ロール設計パターン比較ガイド

## 概要

ユーザーロール機能の設計には複数のアプローチがあります。このドキュメントでは、各設計パターンの特徴、メリット・デメリット、適用場面を比較し、プロジェクトに最適な選択ができるよう整理します。

## 現在の設計（シンプルRBAC）

### 設計概要

```sql
-- roles テーブル
CREATE TABLE roles (
  id bigserial PRIMARY KEY,
  code varchar(20) NOT NULL UNIQUE,
  name varchar(50) NOT NULL,
  description text,
  level integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true NOT NULL
);

-- profiles テーブル
CREATE TABLE profiles (
  id uuid PRIMARY KEY,
  user_id text NOT NULL UNIQUE,
  role_id bigint NOT NULL REFERENCES roles(id)
);
```

### 特徴

- **シンプル**: 1ユーザー = 1ロール
- **レベル制**: 数値による階層的権限管理
- **高パフォーマンス**: 最小限のJOIN
- **理解しやすい**: 直感的な設計

### メリット

- ✅ 開発・保守が容易
- ✅ 高速なクエリ性能
- ✅ 小〜中規模アプリに最適
- ✅ デバッグが簡単

### デメリット

- ❌ 細かい権限制御は困難
- ❌ 複雑なビジネスルールに対応しにくい
- ❌ 動的な権限変更が制限される

### 適用場面

- ユーザー数 < 10,000人
- 権限パターンが単純（3-5種類のロール）
- 開発速度を重視
- 小〜中規模のWebアプリケーション

---

## 設計パターン比較

### 1. 完全RBAC（Role-Based Access Control）

#### 設計概要

```sql
CREATE TABLE users (
  id bigserial PRIMARY KEY,
  username varchar(50) NOT NULL UNIQUE,
  email varchar(100) UNIQUE
);

CREATE TABLE roles (
  id bigserial PRIMARY KEY,
  name varchar(50) NOT NULL UNIQUE,
  description text
);

CREATE TABLE permissions (
  id bigserial PRIMARY KEY,
  name varchar(100) NOT NULL UNIQUE,
  resource varchar(50) NOT NULL,
  action varchar(50) NOT NULL
);

CREATE TABLE user_roles (
  user_id bigint REFERENCES users(id),
  role_id bigint REFERENCES roles(id),
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE role_permissions (
  role_id bigint REFERENCES roles(id),
  permission_id bigint REFERENCES permissions(id),
  PRIMARY KEY (role_id, permission_id)
);
```

#### 特徴

- **最大の柔軟性**: 権限の細かい制御が可能
- **多対多関係**: ユーザーは複数ロールを持てる
- **動的管理**: 管理画面で権限を変更可能
- **拡張性**: 新しい権限・ロールを容易に追加

#### メリット

- ✅ 非常に柔軟な権限制御
- ✅ 業界標準のアプローチ
- ✅ 大規模システムに対応
- ✅ 監査・コンプライアンス対応

#### デメリット

- ❌ 複雑な設計・実装
- ❌ パフォーマンスオーバーヘッド
- ❌ 学習コストが高い

#### 適用場面

- B2Bアプリケーション
- エンタープライズシステム
- 細かい権限制御が必要
- 大規模なユーザーベース

#### 採用例

- Stripe、GitHub、Slack、AWS IAM

---

### 2. ABAC（Attribute-Based Access Control）

#### 設計概要

```sql
CREATE TABLE users (
  id bigserial PRIMARY KEY,
  attributes jsonb -- 部署、役職、地域等
);

CREATE TABLE resources (
  id bigserial PRIMARY KEY,
  type varchar(50),
  attributes jsonb -- 機密レベル、所有者等
);

CREATE TABLE policies (
  id bigserial PRIMARY KEY,
  name varchar(100),
  rules jsonb -- 複雑な条件式
);

CREATE TABLE access_decisions (
  user_id bigint,
  resource_id bigint,
  action varchar(50),
  decision boolean,
  evaluated_at timestamp
);
```

#### 特徴

- **属性ベース**: ユーザー・リソースの属性で判定
- **動的評価**: リアルタイムでアクセス可否を判定
- **ポリシーエンジン**: 複雑なルールを表現可能
- **コンテキスト考慮**: 時間・場所・デバイス等を考慮

#### メリット

- ✅ 最も柔軟な権限制御
- ✅ 複雑なビジネスルールに対応
- ✅ コンプライアンス要件に強い
- ✅ 動的な環境変化に対応

#### デメリット

- ❌ 非常に複雑な設計・実装
- ❌ 高い学習コスト
- ❌ パフォーマンスチューニングが困難
- ❌ デバッグが困難

#### 適用場面

- 金融・医療・政府系システム
- 厳格なコンプライアンス要件
- 複雑な組織構造
- 動的な権限要件

#### 採用例

- Google Cloud IAM、Azure AD、AWS IAM（一部）

---

### 3. 階層型ロール

#### 設計概要

```sql
CREATE TABLE roles (
  id bigserial PRIMARY KEY,
  name varchar(50) NOT NULL,
  parent_role_id bigint REFERENCES roles(id),
  level integer NOT NULL DEFAULT 0
);

CREATE TABLE role_hierarchy (
  parent_id bigint REFERENCES roles(id),
  child_id bigint REFERENCES roles(id),
  depth integer NOT NULL,
  PRIMARY KEY (parent_id, child_id)
);
```

#### 特徴

- **継承関係**: 上位ロールが下位ロールの権限を継承
- **組織構造反映**: 企業の階層構造をモデル化
- **効率的管理**: 上位ロール変更で下位に波及

#### メリット

- ✅ 組織構造に自然
- ✅ 権限管理が効率的
- ✅ 理解しやすい階層関係

#### デメリット

- ❌ 複雑なクエリが必要
- ❌ 循環参照のリスク
- ❌ 柔軟性に欠ける場合がある

#### 適用場面

- 企業の組織管理システム
- 明確な階層構造がある場合
- 権限継承が自然な業務

---

### 4. マルチテナント対応

#### 設計概要

```sql
CREATE TABLE tenants (
  id bigserial PRIMARY KEY,
  name varchar(100) NOT NULL,
  domain varchar(100) UNIQUE
);

CREATE TABLE roles (
  id bigserial PRIMARY KEY,
  name varchar(50) NOT NULL,
  tenant_id bigint REFERENCES tenants(id)
);

CREATE TABLE user_tenant_roles (
  user_id bigint,
  tenant_id bigint REFERENCES tenants(id),
  role_id bigint REFERENCES roles(id),
  PRIMARY KEY (user_id, tenant_id, role_id)
);
```

#### 特徴

- **テナント分離**: 組織毎の権限管理
- **データ分離**: テナント間のデータ漏洩防止
- **スケーラブル**: 多数の組織に対応

#### メリット

- ✅ SaaSアプリケーションに最適
- ✅ セキュリティが強固
- ✅ 組織毎のカスタマイズ可能

#### デメリット

- ❌ 設計・実装が複雑
- ❌ クロステナント機能が困難
- ❌ 運用コストが高い

#### 適用場面

- SaaSアプリケーション
- B2Bプラットフォーム
- 複数組織をサポート

#### 採用例

- Salesforce、Notion、Monday.com

---

### 5. ビットマスク型

#### 設計概要

```sql
CREATE TABLE roles (
  id bigserial PRIMARY KEY,
  name varchar(50) NOT NULL,
  permission_mask bigint NOT NULL DEFAULT 0
);

-- 例: permission_mask = 7 (111 in binary) = read + write + delete
-- ビット位置: 1=read, 2=write, 4=delete, 8=admin, etc.
```

#### 特徴

- **高速**: ビット演算による超高速権限チェック
- **コンパクト**: 最小限のストレージ
- **シンプル**: 単純な数値演算

#### メリット

- ✅ 最高のパフォーマンス
- ✅ メモリ効率が良い
- ✅ 実装がシンプル

#### デメリット

- ❌ 権限数に制限（64個まで）
- ❌ 権限の意味が不明確
- ❌ 動的な権限追加が困難

#### 適用場面

- ゲームエンジン
- リアルタイムシステム
- 権限数が限定的
- 最高のパフォーマンスが必要

---

## 設計選択の指針

### 📊 比較表

| 設計パターン   | 複雑さ     | パフォーマンス | 柔軟性     | 拡張性     | 学習コスト |
| -------------- | ---------- | -------------- | ---------- | ---------- | ---------- |
| シンプルRBAC   | ⭐         | ⭐⭐⭐⭐⭐     | ⭐⭐       | ⭐⭐       | ⭐         |
| 完全RBAC       | ⭐⭐⭐     | ⭐⭐⭐         | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐     |
| ABAC           | ⭐⭐⭐⭐⭐ | ⭐⭐           | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 階層型         | ⭐⭐       | ⭐⭐⭐         | ⭐⭐⭐     | ⭐⭐⭐     | ⭐⭐       |
| マルチテナント | ⭐⭐⭐⭐   | ⭐⭐⭐         | ⭐⭐⭐⭐   | ⭐⭐⭐⭐   | ⭐⭐⭐⭐   |
| ビットマスク   | ⭐         | ⭐⭐⭐⭐⭐     | ⭐         | ⭐         | ⭐         |

### 🎯 選択基準

#### **シンプルRBACを選ぶべき場合**

- ✅ ユーザー数 < 10,000人
- ✅ 権限パターンが単純（3-5種類のロール）
- ✅ 開発速度を重視
- ✅ 小〜中規模のWebアプリケーション
- ✅ チームの技術レベルが中程度

#### **完全RBACに移行すべき場合**

- ✅ 細かい権限制御が必要
- ✅ 権限パターンが複雑
- ✅ 管理者が権限を動的に変更したい
- ✅ B2Bアプリケーション
- ✅ エンタープライズ要件

#### **ABACを検討すべき場合**

- ✅ 属性ベースの複雑なルール
- ✅ コンプライアンス要件が厳しい
- ✅ 大規模エンタープライズ
- ✅ 動的な環境変化が多い

#### **マルチテナントが必要な場合**

- ✅ SaaSアプリケーション
- ✅ 複数組織をサポート
- ✅ 組織間のデータ分離が重要

---

## 実装例

### シンプルRBAC（現在の設計）

```typescript
// 権限チェック
export function hasRoleLevel(
  userRoleLevel: number,
  requiredLevel: number,
): boolean {
  return userRoleLevel >= requiredLevel;
}

// 使用例
const { user } = useAuth();
if (hasRoleLevel(user.role.level, 5)) {
  // モデレーター以上の機能
}
```

### 完全RBAC

```typescript
// 権限チェック
export async function hasPermission(
  userId: number,
  permission: string,
): Promise<boolean> {
  const result = await db.query(
    `
    SELECT COUNT(*) > 0 as has_permission
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE u.id = ? AND p.name = ?
  `,
    [userId, permission],
  );

  return result[0].has_permission;
}

// 使用例
if (await hasPermission(userId, "users.create")) {
  // ユーザー作成権限がある
}
```

### ABAC

```typescript
// ポリシー評価エンジン
export async function evaluateAccess(
  user: User,
  resource: Resource,
  action: string,
  context: Context,
): Promise<boolean> {
  const policies = await getPoliciesForResource(resource.type);

  for (const policy of policies) {
    const result = await evaluatePolicy(policy, {
      user,
      resource,
      action,
      context,
    });

    if (result.decision === "DENY") return false;
    if (result.decision === "ALLOW") return true;
  }

  return false; // デフォルトはDENY
}
```

---

## 移行戦略

### 現在の設計から完全RBACへの段階的移行

#### Phase 1: Permissionsテーブル追加

```sql
CREATE TABLE permissions (
  id bigserial PRIMARY KEY,
  code varchar(50) NOT NULL UNIQUE,
  name varchar(100) NOT NULL,
  resource varchar(50) NOT NULL,
  action varchar(50) NOT NULL
);

CREATE TABLE role_permissions (
  role_id bigint REFERENCES roles(id),
  permission_id bigint REFERENCES permissions(id),
  PRIMARY KEY (role_id, permission_id)
);
```

#### Phase 2: 既存ロールの権限マッピング

```sql
-- 既存のlevelベース権限をpermissionsに変換
INSERT INTO permissions (code, name, resource, action) VALUES
('admin.all', '全管理権限', '*', '*'),
('moderator.manage', 'モデレーション権限', 'content', 'moderate'),
('user.basic', '基本権限', 'profile', 'read');
```

#### Phase 3: アプリケーションコードの段階的移行

```typescript
// 旧システムとの互換性を保ちながら移行
export function hasAccess(user: User, permission: string): boolean {
  // 新システムを優先
  if (user.permissions?.includes(permission)) {
    return true;
  }

  // フォールバック：旧システム
  return hasRoleLevel(user.role.level, getRequiredLevel(permission));
}
```

---

## まとめ

### 現在の設計の評価

**現在のシンプルRBAC設計は適切で実用的**です。以下の理由から推奨されます：

1. **業界標準**: 多くのWebアプリケーションで採用
2. **バランス**: シンプルさと機能性のバランスが良い
3. **パフォーマンス**: 高速なクエリ実行
4. **保守性**: 理解・保守が容易
5. **拡張性**: 必要に応じて他のパターンに移行可能

### 将来の拡張計画

現在の要件では**シンプルRBACが最適解**ですが、以下の場合は移行を検討：

- **完全RBAC**: より複雑な権限制御が必要になった場合
- **マルチテナント**: SaaS化や複数組織サポートが必要な場合
- **ABAC**: 厳格なコンプライアンス要件が発生した場合

### 推奨アクション

1. **現在の設計を継続**: 当面はシンプルRBACで十分
2. **モニタリング**: 権限要件の複雑化を監視
3. **段階的移行**: 必要に応じて完全RBACに移行
4. **ドキュメント化**: 設計判断の記録を保持

---

_このドキュメントは、プロジェクトの成長に合わせて定期的に見直し・更新することを推奨します。_
