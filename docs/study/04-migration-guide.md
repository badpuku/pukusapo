# マイグレーション - データベースの初期設定

## 🎯 この章で学ぶこと

- マイグレーションとは何か
- 実際の実行手順
- エラーが起きた時の対処法
- データベースの確認方法

## 📚 マイグレーションとは？

**マイグレーション**とは、データベースの構造（テーブル、インデックス、制約など）を変更するためのスクリプトです。

### 🔄 なぜマイグレーションが必要？

```
開発の流れ：
1. 新しい機能を考える
   ↓
2. 必要なテーブル設計を決める
   ↓
3. マイグレーションファイルを作成
   ↓
4. マイグレーションを実行
   ↓
5. データベースが更新される
```

### 📁 マイグレーションファイルの場所

```
プロジェクト/
├── supabase/
│   └── migrations/
│       ├── 0000_initialize-profiles.sql           ← 元のファイル
│       └── 0000_initialize-profiles-twada-style.sql ← t-wada設計版
└── ...
```

## 🚀 実行手順

### 1. 事前準備

#### Supabase CLIのインストール確認

```bash
# Supabase CLIがインストールされているか確認
supabase --version

# インストールされていない場合
npm install -g supabase
```

#### プロジェクトの確認

```bash
# プロジェクトディレクトリに移動
cd /path/to/your/project

# Supabaseプロジェクトが初期化されているか確認
ls supabase/
# → config.toml, migrations/ などがあることを確認
```

### 2. ローカルSupabaseの起動

```bash
# ローカルのSupabaseを起動
supabase start

# 起動完了後、以下のような情報が表示される
# API URL: http://localhost:54321
# DB URL: postgresql://postgres:postgres@localhost:54322/postgres
# Studio URL: http://localhost:54323
```

### 3. マイグレーションの実行

#### 現在のマイグレーション状態を確認

```bash
# 適用済みのマイグレーションを確認
supabase migration list

# 出力例：
# Local    Remote    Time                 Name
# ✓        ✓         20231201120000       initial_schema
# ✗        ✗         20231201130000       0000_initialize-profiles-twada-style
```

#### マイグレーションの実行

```bash
# すべてのマイグレーションを適用
supabase db push

# または、特定のマイグレーションのみ実行
supabase migration up
```

### 4. 実行結果の確認

```bash
# 成功した場合の出力例
Applying migration 0000_initialize-profiles-twada-style.sql...
✓ Migration applied successfully
Database schema updated
```

## 🔍 データベースの確認方法

### 1. Supabase Studioで確認

```bash
# Supabase Studioを開く
open http://localhost:54323
```

**Studioでの確認項目：**

1. **Tables**: 作成されたテーブル一覧
2. **Authentication**: RLSポリシーの確認
3. **Database**: SQL実行・データ確認

### 2. コマンドラインで確認

```bash
# PostgreSQLに直接接続
supabase db connect

# または
psql postgresql://postgres:postgres@localhost:54322/postgres
```

#### テーブル一覧の確認

```sql
-- 作成されたテーブルを確認
\dt

-- 出力例：
--              List of relations
--  Schema |      Name       | Type  |  Owner
-- --------+-----------------+-------+----------
--  public | profiles        | table | postgres
--  public | roles           | table | postgres
--  public | permissions     | table | postgres
--  public | role_permissions| table | postgres
--  public | user_roles      | table | postgres
```

#### テーブル構造の確認

```sql
-- rolesテーブルの構造を確認
\d roles

-- 出力例：
--                              Table "public.roles"
--      Column       |           Type           | Collation | Nullable | Default
-- ------------------+--------------------------+-----------+----------+---------
--  id               | bigint                   |           | not null | nextval(...)
--  code             | character varying(50)    |           | not null |
--  name             | character varying(100)   |           | not null |
--  permission_level | integer                  |           | not null | 0
--  is_active        | boolean                  |           | not null | true
--  created_at       | timestamp with time zone |           | not null | now()
--  updated_at       | timestamp with time zone |           | not null | now()
```

#### 初期データの確認

```sql
-- ロールデータの確認
SELECT id, code, name, permission_level FROM roles;

-- 出力例：
--  id |   code    |      name      | permission_level
-- ----+-----------+----------------+------------------
--   1 | user      | 一般ユーザー   |                1
--   2 | moderator | モデレーター   |                5
--   3 | admin     | 管理者         |               10

-- 権限データの確認
SELECT id, code, name, resource, action FROM permissions LIMIT 5;

-- ロール権限関連の確認
SELECT
  r.code as role_code,
  p.code as permission_code
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
JOIN permissions p ON rp.permission_id = p.id
ORDER BY r.permission_level, p.code;
```

### 3. RLSポリシーの確認

```sql
-- RLSが有効になっているテーブルを確認
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true;

-- ポリシー一覧の確認
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public';
```

## ⚠️ よくあるエラーと対処法

### 1. **マイグレーションファイルが見つからない**

```bash
Error: Migration file not found
```

**対処法：**

```bash
# ファイルの存在確認
ls supabase/migrations/

# ファイル名の確認（タイムスタンプが正しいか）
# 正しい形式：YYYYMMDDHHMMSS_description.sql
```

### 2. **権限エラー**

```bash
Error: permission denied for table roles
```

**対処法：**

```bash
# Supabaseを再起動
supabase stop
supabase start

# または、権限をリセット
supabase db reset
```

### 3. **制約違反エラー**

```sql
ERROR: duplicate key value violates unique constraint "uq_roles_code"
```

**対処法：**

```sql
-- 既存データの確認
SELECT * FROM roles WHERE code = 'admin';

-- 重複データがある場合は削除
DELETE FROM roles WHERE code = 'admin' AND id != 1;
```

### 4. **外部キー制約エラー**

```sql
ERROR: insert or update on table "profiles" violates foreign key constraint
```

**対処法：**

```sql
-- 参照先のデータが存在するか確認
SELECT * FROM roles WHERE id = 1;

-- 存在しない場合は、まずrolesテーブルにデータを挿入
INSERT INTO roles (code, name, permission_level)
VALUES ('user', '一般ユーザー', 1);
```

## 🔧 マイグレーションのベストプラクティス

### 1. **バックアップの作成**

```bash
# 本番環境では必ずバックアップを作成
supabase db dump --local > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. **段階的な適用**

```bash
# 一度にすべてを適用せず、段階的に実行
supabase migration up --limit 1

# 問題がないことを確認してから次へ
supabase migration up --limit 1
```

### 3. **ロールバック準備**

```sql
-- 問題が発生した場合のロールバック用SQL
-- （事前に準備しておく）

-- テーブル削除
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS profiles;
DROP TABLE IF EXISTS roles;

-- 関数削除
DROP FUNCTION IF EXISTS update_updated_at_column();
```

### 4. **テストデータの投入**

```sql
-- 開発環境用のテストデータ
INSERT INTO profiles (user_id, role_id, email, username, full_name)
VALUES
  ('test_user_1', 1, 'test1@example.com', 'testuser1', 'テストユーザー1'),
  ('test_user_2', 2, 'test2@example.com', 'testuser2', 'テストユーザー2'),
  ('test_admin', 3, 'admin@example.com', 'testadmin', 'テスト管理者');
```

## 📊 マイグレーション後の動作確認

### 1. **基本的な権限チェック**

```sql
-- ユーザーの権限一覧を取得
SELECT * FROM v_user_permissions WHERE user_id = 'test_user_1';

-- 特定の権限を持つユーザーを検索
SELECT
  p.username,
  r.code as role_code
FROM profiles p
JOIN roles r ON p.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions perm ON rp.permission_id = perm.id
WHERE perm.code = 'users.delete';
```

### 2. **RLSポリシーのテスト**

```sql
-- 管理者として接続（auth.uid()をシミュレート）
SET request.jwt.claims TO '{"sub": "test_admin"}';

-- 全ユーザーが見えることを確認
SELECT username FROM profiles;

-- 一般ユーザーとして接続
SET request.jwt.claims TO '{"sub": "test_user_1"}';

-- 自分のデータのみ見えることを確認
SELECT username FROM profiles;
```

### 3. **パフォーマンステスト**

```sql
-- インデックスが効いているか確認
EXPLAIN ANALYZE
SELECT p.username
FROM profiles p
JOIN roles r ON p.role_id = r.id
WHERE r.code = 'admin';

-- 実行計画でIndex Scanが使われていることを確認
```

## 🤔 よくある質問

### Q1: マイグレーションを元に戻したい場合は？

**A:**

```bash
# 特定のマイグレーションまで戻す
supabase migration down --target 20231201120000

# 完全にリセット
supabase db reset
```

### Q2: 本番環境にマイグレーションを適用するには？

**A:**

```bash
# リモートのSupabaseプロジェクトに適用
supabase link --project-ref your-project-ref
supabase db push
```

### Q3: マイグレーションファイルを編集したい場合は？

**A:**

- **適用前**: ファイルを直接編集可能
- **適用後**: 新しいマイグレーションファイルを作成

---

**前へ**: [権限の仕組み](./03-permission-system.md) ←  
**次へ**: [セキュリティ](./05-security.md) →
