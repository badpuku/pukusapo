# データベース設計定義書

## 概要

本システムは、ロールベースアクセス制御（RBAC）を基盤とした権限管理システムです。t-wada設計原則に基づき、拡張性と保守性を重視した設計となっています。

## システム構成要素

### 1. 認証・認可システム

- **認証**: Clerk認証システムを使用
- **認可**: ロールベースアクセス制御（RBAC）
- **セキュリティ**: Row Level Security (RLS) による細かいアクセス制御

### 2. 主要機能

- ユーザープロファイル管理
- ロール・権限管理
- コンテンツ管理
- システム管理

## テーブル設計

### 1. ロール管理テーブル (`roles`)

システム内で利用可能なユーザーロールを定義するマスタテーブル

| カラム名         | データ型     | 制約                    | 説明                 |
| ---------------- | ------------ | ----------------------- | -------------------- |
| id               | bigserial    | PRIMARY KEY             | ロールID（自動採番） |
| code             | varchar(50)  | NOT NULL, UNIQUE        | ロール識別コード     |
| name             | varchar(100) | NOT NULL                | ロール表示名         |
| description      | text         | -                       | ロール説明           |
| permission_level | integer      | NOT NULL, DEFAULT 0     | 権限レベル（0-100）  |
| is_active        | boolean      | NOT NULL, DEFAULT true  | 有効フラグ           |
| created_at       | timestamptz  | NOT NULL, DEFAULT now() | 作成日時             |
| updated_at       | timestamptz  | NOT NULL, DEFAULT now() | 更新日時             |

**制約条件:**

- `code`: 小文字英数字とアンダースコアのみ (`^[a-z][a-z0-9_]*$`)
- `name`: 空文字不可
- `permission_level`: 0-100の範囲

**初期データ:**

- `user` (一般ユーザー, レベル1)
- `moderator` (モデレーター, レベル5)
- `admin` (管理者, レベル10)

### 2. 権限管理テーブル (`permissions`)

システム内で利用可能な権限を定義するマスタテーブル

| カラム名    | データ型     | 制約                    | 説明               |
| ----------- | ------------ | ----------------------- | ------------------ |
| id          | bigserial    | PRIMARY KEY             | 権限ID（自動採番） |
| code        | varchar(100) | NOT NULL, UNIQUE        | 権限識別コード     |
| name        | varchar(200) | NOT NULL                | 権限表示名         |
| resource    | varchar(50)  | NOT NULL                | リソース名         |
| action      | varchar(50)  | NOT NULL                | アクション名       |
| description | text         | -                       | 権限説明           |
| is_active   | boolean      | NOT NULL, DEFAULT true  | 有効フラグ         |
| created_at  | timestamptz  | NOT NULL, DEFAULT now() | 作成日時           |
| updated_at  | timestamptz  | NOT NULL, DEFAULT now() | 更新日時           |

**制約条件:**

- `code`: resource.action形式 (`^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$`)
- `resource`: 小文字英数字とアンダースコア
- `action`: 小文字英数字とアンダースコア
- `(resource, action)`: 複合ユニーク制約

### 3. ロール・権限関連テーブル (`role_permissions`)

ロールと権限の多対多関係を管理するテーブル

| カラム名      | データ型    | 制約                    | 説明         |
| ------------- | ----------- | ----------------------- | ------------ |
| role_id       | bigint      | NOT NULL, FK            | ロールID     |
| permission_id | bigint      | NOT NULL, FK            | 権限ID       |
| granted_at    | timestamptz | NOT NULL, DEFAULT now() | 権限付与日時 |
| granted_by    | text        | -                       | 権限付与者ID |

**主キー:** `(role_id, permission_id)`

### 4. ユーザープロファイルテーブル (`profiles`)

ユーザーのプロファイル情報とロール割り当てを管理するテーブル

| カラム名   | データ型    | 制約                                   | 説明                          |
| ---------- | ----------- | -------------------------------------- | ----------------------------- |
| id         | uuid        | PRIMARY KEY, DEFAULT gen_random_uuid() | プロファイルID                |
| user_id    | text        | NOT NULL, UNIQUE                       | Clerk認証システムのユーザーID |
| role_id    | bigint      | NOT NULL, FK                           | 割り当てられたロールID        |
| email      | text        | UNIQUE                                 | メールアドレス                |
| username   | text        | UNIQUE                                 | ユーザー名                    |
| full_name  | text        | -                                      | フルネーム                    |
| avatar_url | text        | -                                      | アバター画像URL               |
| is_active  | boolean     | NOT NULL, DEFAULT true                 | 有効フラグ                    |
| created_at | timestamptz | NOT NULL, DEFAULT now()                | 作成日時                      |
| updated_at | timestamptz | NOT NULL, DEFAULT now()                | 更新日時                      |

**制約条件:**

- `email`: メール形式チェック (`^[^@]+@[^@]+\.[^@]+$`)
- `username`: 英数字とアンダースコア、3-30文字 (`^[a-zA-Z0-9_]{3,30}$`)
- `avatar_url`: HTTP/HTTPS URLのみ

### 5. ユーザーロール履歴テーブル (`user_roles`)

将来の多ロール対応のためのユーザーロール履歴テーブル

| カラム名    | データ型    | 制約                    | 説明             |
| ----------- | ----------- | ----------------------- | ---------------- |
| id          | bigserial   | PRIMARY KEY             | 履歴ID           |
| user_id     | text        | NOT NULL                | ユーザーID       |
| role_id     | bigint      | NOT NULL, FK            | ロールID         |
| assigned_by | text        | -                       | 割り当て実行者ID |
| assigned_at | timestamptz | NOT NULL, DEFAULT now() | 割り当て日時     |
| expires_at  | timestamptz | -                       | 有効期限         |
| is_active   | boolean     | NOT NULL, DEFAULT true  | 有効フラグ       |
| created_at  | timestamptz | NOT NULL, DEFAULT now() | 作成日時         |
| updated_at  | timestamptz | NOT NULL, DEFAULT now() | 更新日時         |

## 権限体系

### ロール階層

1. **user** (権限レベル: 1)
   - 基本的な機能を利用できる標準ユーザー
2. **moderator** (権限レベル: 5)
   - 一部の管理機能を利用できる中間管理者
3. **admin** (権限レベル: 10)
   - すべての管理機能を利用できるシステム管理者

### 権限カテゴリ

#### プロファイル関連権限

- `profile.read`: プロファイル閲覧
- `profile.update`: プロファイル更新

#### ユーザー管理権限

- `users.read`: ユーザー一覧閲覧
- `users.create`: ユーザー作成
- `users.update`: ユーザー更新
- `users.delete`: ユーザー削除

#### ロール・権限管理

- `roles.read`: ロール一覧閲覧
- `roles.create`: ロール作成
- `roles.update`: ロール更新
- `roles.delete`: ロール削除
- `permissions.read`: 権限一覧閲覧
- `permissions.manage`: 権限管理

#### コンテンツ管理権限

- `content.read`: コンテンツ閲覧
- `content.create`: コンテンツ作成
- `content.update`: コンテンツ更新
- `content.delete`: コンテンツ削除
- `content.moderate`: コンテンツモデレーション

#### システム管理権限

- `system.settings`: システム設定
- `system.monitoring`: システム監視
- `system.backup`: システムバックアップ

### ロール別権限割り当て

| 権限             | user | moderator | admin |
| ---------------- | ---- | --------- | ----- |
| profile.read     | ✓    | ✓         | ✓     |
| profile.update   | ✓    | ✓         | ✓     |
| users.read       | -    | ✓         | ✓     |
| users.create     | -    | -         | ✓     |
| users.update     | -    | -         | ✓     |
| users.delete     | -    | -         | ✓     |
| roles.\*         | -    | -         | ✓     |
| permissions.\*   | -    | -         | ✓     |
| content.read     | ✓    | ✓         | ✓     |
| content.create   | -    | ✓         | ✓     |
| content.update   | -    | ✓         | ✓     |
| content.delete   | -    | ✓         | ✓     |
| content.moderate | -    | ✓         | ✓     |
| system.\*        | -    | -         | ✓     |

## セキュリティ設計

### Row Level Security (RLS)

すべてのテーブルでRLSが有効化されており、以下のポリシーが適用されています：

#### ロールテーブル

- **閲覧**: 有効なロールのみ全員閲覧可能
- **編集**: 管理者のみ

#### 権限テーブル

- **閲覧**: 有効な権限のみ全員閲覧可能
- **編集**: 管理者のみ

#### プロファイルテーブル

- **閲覧**: 自分のプロファイルまたは権限レベル10以上
- **編集**: 自分のプロファイルまたは権限レベル10以上

#### ロール権限関連テーブル

- **全操作**: 管理者のみ

### 認証連携

- **認証プロバイダ**: Clerk
- **ユーザーID**: Clerkから提供されるユーザーIDを使用
- **セッション管理**: Clerkのセッション管理機能を利用

## インデックス設計

### パフォーマンス最適化

各テーブルに以下のインデックスが設定されています：

- **roles**: code（アクティブのみ）、permission_level（降順、アクティブのみ）
- **permissions**: resource+action（アクティブのみ）、code（アクティブのみ）
- **profiles**: role_id（アクティブのみ）、email（非NULL、アクティブのみ）、username（非NULL、アクティブのみ）
- **user_roles**: user_id（アクティブのみ）、role_id（アクティブのみ）、expires_at（非NULL）

## ビュー定義

### v_user_permissions

ユーザーが持つ全権限を一覧表示するビュー

```sql
SELECT
  p.user_id,
  p.username,
  p.email,
  r.code as role_code,
  r.name as role_name,
  r.permission_level,
  perm.code as permission_code,
  perm.name as permission_name,
  perm.resource,
  perm.action
FROM profiles p
JOIN roles r ON p.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions perm ON rp.permission_id = perm.id
WHERE p.is_active = true
  AND r.is_active = true
  AND perm.is_active = true
```

## 自動化機能

### トリガー

- **updated_at自動更新**: 全テーブルで更新時に`updated_at`カラムを自動更新

### 関数

- `update_updated_at_column()`: updated_at自動更新用のトリガー関数

## 拡張性

### 将来対応予定機能

1. **多ロール対応**: `user_roles`テーブルを使用した複数ロール割り当て
2. **期限付きロール**: `expires_at`による時限的ロール割り当て
3. **権限継承**: 階層的な権限継承システム
4. **動的権限**: リソース固有の動的権限管理

### 設計原則

- **単一責任の原則**: 各テーブルは明確な責任を持つ
- **開放閉鎖の原則**: 新機能追加時に既存コードの変更を最小化
- **依存関係逆転の原則**: 抽象に依存し、具象に依存しない設計
- **インターフェース分離の原則**: 必要な機能のみを公開

## 運用・保守

### 監視項目

- ユーザー登録数の推移
- ロール別ユーザー分布
- 権限使用状況
- セキュリティポリシー違反

### バックアップ戦略

- 定期的なデータベース全体バックアップ
- 権限変更の監査ログ
- 重要な設定変更の履歴管理

### パフォーマンス監視

- クエリ実行時間の監視
- インデックス使用状況の確認
- RLSポリシーのパフォーマンス影響評価
