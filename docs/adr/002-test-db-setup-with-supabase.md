# ADR-002: Supabase 環境におけるテスト用データベースの構成

- **ステータス**: 承認済み
- **日付**: 2026-03-22
- **決定者**: m_sena

## コンテキスト

pukusapo の backend は Rails + PostgreSQL で、ローカル開発環境の DB にはローカル Supabase を使用している。rspec によるテストを導入するにあたり、テスト用 DB の構成を決める必要がある。

### 課題

1. **dev と test の DB 分離**: rspec は実行時に DB を毎回リセット（purge）するため、dev 用 DB と共用すると開発データが消える
2. **Supabase 固有スキーマの不在**: `db/schema.rb` には Supabase が自動作成する `extensions`, `graphql`, `vault` スキーマへの参照が含まれている。テスト用 DB は素の PostgreSQL なのでこれらが存在せず、スキーマロードが失敗する
3. **外部サービスの認証情報**: テスト環境には Clerk 等の環境変数が設定されていないため、Rails 起動時に初期化エラーが発生する

## 決定

### 1. テスト用 DB はローカル Supabase の PostgreSQL サーバー上に別データベースとして作成する

Supabase の実体は PostgreSQL サーバーなので、その上に `backend_test` を追加作成し dev 用の `postgres` DB と共存させる。

#### 検討した代替案

- **Supabase とは別に PostgreSQL を立てる**: テストのためだけに別サーバーを管理する運用コストに見合わない
- **dev 用 DB をテストにも使う**: rspec の purge で開発データが消えるため不可

#### 理由

- 追加のインフラ不要で `database.yml` の設定だけで完結する
- CI では別途 PostgreSQL service container を使うため、ローカル固有の構成として割り切れる

### 2. Supabase 固有スキーマは `db:schema:load` の前処理として自動作成する

テスト用 DB は素の PostgreSQL なので、Supabase が通常自動作成する `extensions`, `graphql`, `vault` スキーマが存在しない。これを Rake タスクの hook で `db:schema:load` の前に自動作成する。

#### 検討した代替案

- **`spec/rails_helper.rb` で毎回実行する**: スキーマ作成は DB 構築時に1回だけ必要な処理であり、毎テスト実行時に走らせるのは責務の混在
- **`db/schema.rb` から Supabase 固有の記述を削除する**: `schema.rb` は `db:schema:dump` で自動生成されるため、次の dump で元に戻る

#### 理由

- DB 準備のロジックが DB 準備の場所（Rake タスク）にまとまり責務が明確
- CI でも `bin/rails db:test:prepare` で同じ hook が走るため追加対応不要

### 3. Clerk の初期化はテスト環境ではダミー値を使用する

テストでは Clerk API を実際に叩かないため、初期化が通りさえすればよい。

#### 検討した代替案

- **`.env.test` でテスト用キーを管理する**: ファイル管理が増え、シークレットの取り扱いに注意が必要になる

#### 理由

- テストに外部サービスへの実接続は不要
- 設定ファイルを増やさずコード上で完結する

## 補足: CI 環境について

CI（GitHub Actions 等）ではローカル Supabase は使わず、ワークフロー内で PostgreSQL の service container を立てる。Rake タスクの hook により Supabase 固有スキーマの作成は CI でも自動で行われる。
