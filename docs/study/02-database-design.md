# データベース設計 - テーブル構造を理解しよう

## 🎯 この章で学ぶこと

- データベースの全体構造
- 各テーブルの役割と関係
- なぜこの設計にしたのか
- 実際のデータ例

## 🗄️ データベース全体図

```
📊 ユーザーロール機能のデータベース構造

┌─────────────┐    ┌─────────────────┐    ┌─────────────┐
│    roles    │    │ role_permissions│    │permissions  │
│             │◄───┤                 ├───►│             │
│ id          │    │ role_id         │    │ id          │
│ code        │    │ permission_id   │    │ code        │
│ name        │    └─────────────────┘    │ name        │
│ level       │                           │ resource    │
└─────────────┘                           │ action      │
       ▲                                  └─────────────┘
       │
       │
┌─────────────┐    ┌─────────────────┐
│  profiles   │    │   user_roles    │
│             │    │   （将来用）     │
│ id          │    │                 │
│ user_id     │    │ user_id         │
│ role_id     │◄───┤ role_id         │
│ email       │    │ assigned_at     │
│ username    │    │ expires_at      │
└─────────────┘    └─────────────────┘
```

## 📋 各テーブルの詳細説明

### 1. 📁 rolesテーブル（ロール管理）

**役割**: どんなロール（役割）があるかを定義

```sql
CREATE TABLE roles (
  id                bigserial     PRIMARY KEY,  -- ロールID（自動採番）
  code              varchar(50)   UNIQUE,       -- ロールコード（'admin', 'user'など）
  name              varchar(100),               -- 表示名（'管理者', '一般ユーザー'）
  description       text,                       -- 説明
  permission_level  integer,                    -- 権限レベル（1-100）
  is_active         boolean,                    -- 有効/無効
  created_at        timestamptz,                -- 作成日時
  updated_at        timestamptz                 -- 更新日時
);
```

#### 📝 実際のデータ例

| id  | code      | name         | permission_level | description                  |
| --- | --------- | ------------ | ---------------- | ---------------------------- |
| 1   | user      | 一般ユーザー | 1                | 基本的な機能を利用できる     |
| 2   | moderator | モデレーター | 5                | 一部の管理機能を利用できる   |
| 3   | admin     | 管理者       | 10               | すべての管理機能を利用できる |

#### 🔍 なぜこの設計？

- **id（数値）**: 高速な検索・結合のため
- **code（文字列）**: プログラムで使いやすい識別子
- **permission_level**: 階層的な権限管理のため

### 2. 🔑 permissionsテーブル（権限管理）

**役割**: 具体的な権限（できること）を定義

```sql
CREATE TABLE permissions (
  id          bigserial     PRIMARY KEY,  -- 権限ID
  code        varchar(100)  UNIQUE,       -- 権限コード（'users.delete'など）
  name        varchar(200),               -- 表示名
  resource    varchar(50),                -- リソース名（'users', 'content'）
  action      varchar(50),                -- アクション名（'create', 'delete'）
  description text,                       -- 説明
  is_active   boolean                     -- 有効/無効
);
```

#### 📝 実際のデータ例

| id  | code             | name             | resource | action   | description              |
| --- | ---------------- | ---------------- | -------- | -------- | ------------------------ |
| 1   | profile.read     | プロフィール閲覧 | profile  | read     | 自分のプロフィールを見る |
| 2   | profile.update   | プロフィール更新 | profile  | update   | 自分のプロフィールを編集 |
| 3   | users.delete     | ユーザー削除     | users    | delete   | ユーザーを削除する       |
| 4   | content.moderate | コンテンツ管理   | content  | moderate | コンテンツを管理する     |

#### 🔍 なぜresource + actionに分けた？

```typescript
// 権限をグループ化して管理しやすくするため
const userPermissions = permissions.filter((p) => p.resource === "users");
// → ['users.create', 'users.read', 'users.update', 'users.delete']

const readPermissions = permissions.filter((p) => p.action === "read");
// → ['profile.read', 'users.read', 'content.read']
```

### 3. 🔗 role_permissionsテーブル（関連テーブル）

**役割**: どのロールがどの権限を持つかを管理

```sql
CREATE TABLE role_permissions (
  role_id       bigint  REFERENCES roles(id),       -- ロールID
  permission_id bigint  REFERENCES permissions(id), -- 権限ID
  granted_at    timestamptz,                        -- 付与日時
  granted_by    text,                               -- 付与者
  PRIMARY KEY (role_id, permission_id)
);
```

#### 📝 実際のデータ例

| role_id | permission_id | 説明                                  |
| ------- | ------------- | ------------------------------------- |
| 1       | 1             | userロールにprofile.read権限          |
| 1       | 2             | userロールにprofile.update権限        |
| 2       | 1             | moderatorロールにprofile.read権限     |
| 2       | 2             | moderatorロールにprofile.update権限   |
| 2       | 4             | moderatorロールにcontent.moderate権限 |
| 3       | 1             | adminロールにprofile.read権限         |
| 3       | 2             | adminロールにprofile.update権限       |
| 3       | 3             | adminロールにusers.delete権限         |
| 3       | 4             | adminロールにcontent.moderate権限     |

#### 🔍 なぜ別テーブルにした？

**多対多の関係**を表現するため：

- 1つのロールは複数の権限を持つ
- 1つの権限は複数のロールで共有される

```
user ロール ← profile.read → moderator ロール
            ← profile.update → admin ロール
```

### 4. 👤 profilesテーブル（ユーザー情報）

**役割**: ユーザーの基本情報とロール割り当て

```sql
CREATE TABLE profiles (
  id         uuid        PRIMARY KEY,           -- プロフィールID
  user_id    text        UNIQUE,                -- ClerkのユーザーID
  role_id    bigint      REFERENCES roles(id),  -- 割り当てられたロール
  email      text        UNIQUE,                -- メールアドレス
  username   text        UNIQUE,                -- ユーザー名
  full_name  text,                              -- フルネーム
  avatar_url text,                              -- アバター画像URL
  is_active  boolean                            -- アカウント有効/無効
);
```

#### 📝 実際のデータ例

| id    | user_id   | role_id | email             | username | full_name |
| ----- | --------- | ------- | ----------------- | -------- | --------- |
| uuid1 | clerk_123 | 1       | user@example.com  | user123  | 田中太郎  |
| uuid2 | clerk_456 | 2       | mod@example.com   | mod456   | 佐藤花子  |
| uuid3 | clerk_789 | 3       | admin@example.com | admin789 | 管理者    |

### 5. 📚 user_rolesテーブル（将来の拡張用）

**役割**: 将来的に1ユーザーが複数ロールを持つ場合に使用

```sql
CREATE TABLE user_roles (
  id          bigserial   PRIMARY KEY,
  user_id     text,                              -- ユーザーID
  role_id     bigint      REFERENCES roles(id),  -- ロールID
  assigned_by text,                              -- 割り当てた人
  assigned_at timestamptz,                       -- 割り当て日時
  expires_at  timestamptz,                       -- 有効期限
  is_active   boolean                            -- 有効/無効
);
```

## 🔄 テーブル間の関係

### 1. 基本的な関係

```
profiles.role_id → roles.id
（1人のユーザーは1つのロールを持つ）

roles.id ← role_permissions.role_id
（1つのロールは複数の権限を持つ）

permissions.id ← role_permissions.permission_id
（1つの権限は複数のロールで共有される）
```

### 2. 実際のクエリ例

#### ユーザーの権限を取得する

```sql
-- ユーザー'clerk_123'が持つすべての権限を取得
SELECT
  p.user_id,
  r.code as role_code,
  perm.code as permission_code,
  perm.name as permission_name
FROM profiles p
JOIN roles r ON p.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions perm ON rp.permission_id = perm.id
WHERE p.user_id = 'clerk_123'
  AND p.is_active = true
  AND r.is_active = true
  AND perm.is_active = true;
```

#### 特定の権限を持つユーザーを検索

```sql
-- 'users.delete'権限を持つユーザーを検索
SELECT
  p.user_id,
  p.username,
  p.email
FROM profiles p
JOIN roles r ON p.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions perm ON rp.permission_id = perm.id
WHERE perm.code = 'users.delete'
  AND p.is_active = true;
```

## 🛡️ セキュリティ対策

### 1. 制約（Constraints）

```sql
-- データの整合性を保つ制約
CONSTRAINT ck_roles_code_format
  CHECK (code ~ '^[a-z][a-z0-9_]*$')  -- コードは小文字英数字のみ

CONSTRAINT ck_profiles_email_format
  CHECK (email ~ '^[^@]+@[^@]+\.[^@]+$')  -- 正しいメール形式

CONSTRAINT fk_profiles_role_id
  FOREIGN KEY (role_id) REFERENCES roles(id)  -- 存在するロールのみ
```

### 2. インデックス（Index）

```sql
-- 検索を高速化するインデックス
CREATE INDEX idx_profiles_role_id ON profiles(role_id);
CREATE INDEX idx_roles_code_active ON roles(code) WHERE is_active = true;
```

## 💡 設計のポイント

### 1. **正規化**

データの重複を避け、整合性を保つ

```
❌ 悪い例：
profiles テーブルに role_name を直接保存
→ ロール名変更時に全レコード更新が必要

✅ 良い例：
roles テーブルを分離
→ ロール名変更は1箇所のみ
```

### 2. **拡張性**

将来の機能追加に対応

```
現在：1ユーザー = 1ロール（profiles.role_id）
将来：1ユーザー = 複数ロール（user_rolesテーブル）
```

### 3. **パフォーマンス**

よく使われるクエリを高速化

```sql
-- 権限チェックでよく使われるパターン
-- インデックスにより高速化
SELECT 1 FROM profiles p
JOIN roles r ON p.role_id = r.id
WHERE p.user_id = ? AND r.code = 'admin';
```

## 🤔 よくある質問

### Q1: なぜUUIDと数値IDを使い分ける？

**A:**

- **UUID**: 外部公開されるID（セキュリティ）
- **数値ID**: 内部処理用（パフォーマンス）

### Q2: permission_levelは何に使う？

**A:** 階層的な権限チェックに使用

```typescript
// レベル5以上の権限が必要な機能
if (userRole.permission_level >= 5) {
  // モデレーター以上のみアクセス可能
}
```

### Q3: is_activeフラグの意味は？

**A:** 論理削除のため。データを残しつつ無効化できる

```sql
-- 無効なロールは除外
WHERE is_active = true
```

---

**前へ**: [基本概念](./01-basic-concepts.md) ←  
**次へ**: [権限の仕組み](./03-permission-system.md) →
