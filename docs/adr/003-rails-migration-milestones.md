# ADR-003: Rails Backend 移行マイルストーンと設計方針

- **ステータス**: 承認済み
- **日付**: 2026-04-02
- **決定者**: m_sena

## コンテキスト

pukusapo は Frontend から Supabase への直接アクセスを廃止し、Rails backend API 経由に移行中である。
現在 `profiles/me` のみ移行済みで、残りの機能（forms, events, facility accounts, collection jobs）は未移行。
マイルストーンが未定義のため、移行計画を策定する。

## マイルストーン

### MS1: 基盤完成

**ゴール**: Rails backend に安全に機能追加できる土台を main にマージする

- RSpec テスト基盤（FactoryBot, Shoulda::Matchers, AuthHelper）
- Backend CI（brakeman, rubocop, rspec）
- `feature/add_rspec` ブランチをマージ

### MS2: Admin 読み取り系 API

**ゴール**: Admin 画面の「表示」が全て Rails API 経由になる

対象エンドポイント:
- `GET /v1/forms` — フォーム一覧
- `GET /v1/forms/:id` — フォーム詳細
- `GET /v1/events` — イベント一覧
- `GET /v1/users` — ユーザー一覧
- `GET /v1/facility_accounts` — 施設アカウント一覧
- `GET /v1/collection_jobs` — 収集ジョブ一覧

作業内容:
1. Rails 側: モデル定義、コントローラー、request spec
2. Frontend 側: repository 層を `app/api/` + `ApiClient` に差し替え
3. 各エンドポイントごとに PR を作成

### MS3: Admin 書き込み系 API

**ゴール**: Admin 画面が Supabase 完全不要になる

対象エンドポイント:
- `POST/PUT/DELETE /v1/forms`
- `POST/PUT/DELETE /v1/forms/:id/fields`
- `POST/PUT/DELETE /v1/facility_accounts`
- `POST/PUT/DELETE /v1/collection_jobs`

作業内容:
1. Rails 側: create/update/destroy アクション、バリデーション、request spec
2. Frontend 側: mutation 系の repository 呼び出しを API クライアントに差し替え
3. Admin 画面から Supabase 直接アクセスがゼロになることを確認

### MS4: Portal 系 API

**ゴール**: 一般ユーザー向け機能が全て Rails API 経由になる

対象エンドポイント:
- `GET /v1/forms/:id/public` — 公開フォーム取得
- `POST /v1/forms/:id/submissions` — フォーム回答送信

作業内容:
1. 認可: Admin ではないユーザーのアクセス制御
2. Frontend 側: Portal ルートの Supabase 直接アクセスを差し替え

### MS5: Supabase 撤去 + 仕上げ

**ゴール**: Frontend から Supabase 直接アクセスが完全にゼロになり、不要なコードを削除する

作業内容:
1. Frontend: Supabase クライアント、repository 層、関連型定義を削除
2. `BaseAuthContext` から `supabase` フィールドを削除
3. OpenAPI spec 導入を検討（ADR-001 補足に記載の通り、手書きスキーマの置き換え）
4. Supabase の RLS ポリシーを DROP（後述の方針に従い、このタイミングで実施）

## 設計方針

### RLS の扱い（段階的廃止）

**決定**: 移行完了（MS5）まで RLS を残し、完了後に DROP する

理由:
1. 移行中は Frontend が Supabase を直接叩く箇所がまだある。RLS を先に外すとそこが無防備になる
2. Rails は `postgres` ユーザーで接続しており、RLS はバイパスされている。Rails 側には影響しない
3. 新しいテーブルやポリシーを RLS で追加する必要はない。新機能は最初から Rails API 経由のみにする
4. MS5 で「Frontend → Supabase 直接アクセスがゼロ」を確認後、RLS ポリシーを一括 DROP する

### マイグレーション管理

**決定**: 新テーブルは Rails マイグレーションで作る。既存テーブルは触らない

理由:
1. 既存テーブルは Supabase マイグレーションで作成済みであり、Rails で二重管理しない
2. 新テーブルが必要な場合は `rails generate migration` で作成する
3. Supabase 完全撤去時に `schema_format = :sql`（structure.sql）への切り替えを検討する

### CD の整備

現状 Kamal でローカルからコマンド実行でデプロイしている。GitHub Actions での CD を整備する。
- staging: main ブランチへの push 時に自動デプロイ
- production: リリースタグ作成時にデプロイ（または手動トリガー）

## 補足

- 各 MS は独立した PR 群で構成する。1エンドポイント = 1PR を基本とする
- Admin 機能を Portal より先に移行する（内部画面のため影響範囲が限定的）
- OpenAPI 導入は MS5 以降の判断とし、手書きスキーマが増えすぎる前に再評価する
