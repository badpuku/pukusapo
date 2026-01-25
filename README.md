# pukusapo

## 概要

pukusapo は、サークル運営に関わるさまざまをサポートするサービスです。
フォーム作成、参加人数管理、当選確認などなど...

## クイックスタート

### 前提条件

- Docker Desktop がインストール済みで起動していること
- Node.js (推奨: v18以上)
- Deno (推奨: v2.1以上)
- [Clerk](https://clerk.com/) のアカウントとローカル用のApplicationがセッティング済みであること
- [ngrok](https://ngrok.com/) のアカウント（Webhook用）

### 1. プロジェクトのセットアップ

```bash
# 依存関係のインストール
npm ci

# Cloudflare用の環境変数ファイルを作成
cp .dev.vars.example .dev.vars

# Supabase用の環境変数ファイルを作成
cp supabase/.env.local.example supabase/.env.local
```

### 2. 環境変数の設定

環境変数について通り用意するか、sena-m09 からもらってください。

### 3. データベースの起動

```bash
# Supabaseローカル環境の起動
npm run db:start
```

📍 **Supabaseダッシュボード**: http://127.0.0.1:54323/project/default

⚠️ **注意**: 初回起動時はDockerイメージのビルドに時間がかかります（5-10分程度）

### 4. ngrokの設定

```bash
# ngrokでローカルサーバーを公開（Webhook用）
ngrok http --url=your-url.ngrok-free.app 54321
```

### 5. アプリケーションの起動

#### 開発環境（Vite）

```bash
npm run build
npm run dev
```

初回のみ、`npm run build` が必要です。

🌐 **アクセス**: http://localhost:3000/

#### 本番環境（Wrangler）

```bash
npm run build
npm run start
```

🌐 **アクセス**: http://localhost:8788/

## 開発ツール

### データベース操作

今は使ってない

```bash
# マイグレーション生成（カスタム名）
npm run db:generate:custom

# 指定名でマイグレーション生成
npx drizzle-kit generate --custom --name=your_migration_name

# マイグレーション実行
npm run db:push
```

## セットアップガイド

### Clerk Application の設定

1. [Clerk Dashboard](https://dashboard.clerk.com/) にアクセス
2. 新しいApplicationを作成
3. 「API Keys」から `CLERK_PUBLISHABLE_KEY` と `CLERK_SECRET_KEY` を取得
4. Webhook設定で ngrok URL を登録

### ngrok の設定

1. [ngrok](https://ngrok.com/) でアカウント作成
2. authtoken を設定: `ngrok config add-authtoken YOUR_TOKEN`
3. 固定URLを取得

## 環境変数について

### Cloudflare

<table>
  <tr>
    <th>環境</th>
    <th>Publish / Secret</th>
    <th>設定場所</th>
  </tr>
  <tr>
    <td rowspan="2">本番</td>
    <td>Publish</td>
    <td>wrangler.jsonc</td>
  </tr>
  <tr>
    <td>Secret</td>
    <td>Cloudflare の管理画面</td>
  </tr>
  <tr>
    <td rowspan="2">テスト</td>
    <td>Publish</td>
    <td>wrangler.jsonc (env > development)</td>
  </tr>
  <tr>
    <td>Secret</td>
    <td>Cloudflare の管理画面</td>
  </tr>
  <tr>
    <td rowspan="2">ローカル</td>
    <td>Publish</td>
    <td>.dev.vars.local</td>
  </tr>
  <tr>
    <td>Secret</td>
    <td>.dev.vars.local</td>
  </tr>
</table>

| 変数名                         | Publish / Secret | 説明                                          | 取得方法                                                           |
| ------------------------------ | --------------- | --------------------------------------------- | ------------------------------------------------------------------ |
| `APP_ENV`                      | Publish         | 未使用                                        | -                                                                  |
| `APP_VERSION`                  | Publish         | 未使用                                        | -                                                                  |
| `SESSION_SECRET`               | Secret          | セッション暗号化用のシークレットキー               | ランダム文字列を生成                                                   |
| `SUPABASE_URL`                 | Publish         | SupabaseプロジェクトのURL                       | Supabase Dashboard → Settings → Data API → Project URL             |
| `SUPABASE_ANON_KEY`            | Secret          | Supabaseの匿名キー                             | Supabase Dashboard → Settings → API Keys → anon public             |
| `CLOUDFLARE_API_TOKEN`         | Secret          | Cloudflare API操作用のトークン                  | Cloudflare Dashboard → My Profile → API Tokens → Create Token      |
| `CLOUDFLARE_ACCOUNT_ID`        | Secret          | CloudflareアカウントID                         | Cloudflare Dashboard → Workers & Pages → 右サイドバーの Account ID |
| `CLERK_SECRET_KEY`             | Publish         | Clerkの秘密キー                                | Clerk Dashboard → Configure → API Keys → Secret keys               |
| `VITE_CLERK_PUBLISHABLE_KEY`   | Secret          | Clerkの公開キー                                | Clerk Dashboard → Configure → API Keys → Publishable keys          |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Secret          | Clerk Webhook署名検証用のシークレット             | Clerk Dashboard → Webhooks → Add Endpoint → Signing Secret         |
| `ALLOWED_HOSTS`                | Publish         | 許可するホスト名のリスト（ローカル用）              | ngrok のドメイン名を設定（例: your-domain.ngrok-free.app）              |

> [!CAUTION]
> ローカル環境から `npm run deploy` などで deploy すると、.dev.vars ファイルに定義している `VITE_` 接頭辞の変数がアプリ上で読み込めるようになる。
> ローカル用の環境変数が使われ、アプリが正常に動作しなくなるため、Github Actions を使ってデプロイすること。

### Supabase

| 環境     | 設定場所              |
| -------- | --------------------- |
| 本番     | Supabase の管理画面   |
| テスト   | Supabase の管理画面   |
| ローカル | ./supabase/.env.local |

| 変数名                                | 説明                                                         | 取得方法                                                       |
| ------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------- |
| `CLERK_DOMAIN`                        | Clerkのドメイン名（カスタムドメイン使用時）                  | Clerk Dashboard → Configure → Developers > Domains             |
| `CLERK_WEBHOOK_SECRET`                | Clerk Webhook検証用のシークレット                            | Clerk Dashboard → Webhooks → Add Endpoint → Signing Secret     |
| `FUNCTIONS_SUPABASE_URL`              | Supabase Edge Functions 用の Supabase URL                    | Supabase Dashboard → Settings → API Keys → Project URL         |
| `FUNCTIONS_SUPABASE_SERVICE_ROLE_KEY` | Supabase Edge Functions 用のサービスロールキー（管理者権限） | Supabase Dashboard → Settings → API Keys → service_role secret |

## Package.json の scripts について

| Script 名            | 環境     | 説明                                        |
| -------------------- | -------- | ------------------------------------------- |
| `prebuild`           | 共通     | アイコンを生成してからビルドの前処理を実行  |
| `build`              | 共通     | React Routerアプリケーションをビルド        |
| `deploy`             | 本番     | ビルド後にWranglerでCloudflareにデプロイ    |
| `deploy:dev`         | 開発     | 開発環境用の設定でビルド・デプロイ          |
| `dev`                | ローカル | React Router開発サーバーを起動              |
| `gen:icons`          | 共通     | public/iconsからReactコンポーネントを生成   |
| `lint`               | 共通     | ESLintでコードの静的解析を実行              |
| `start`              | ローカル | Wrangler開発サーバーを起動                  |
| `format`             | 共通     | コードフォーマットを実行（lint + prettier） |
| `format:lint`        | 共通     | ESLintで自動修正を実行                      |
| `format:code`        | 共通     | Prettierでコードフォーマットを実行          |
| `typecheck`          | 共通     | TypeScriptの型チェックを実行                |
| `typegen`            | 共通     | Wrangler・React Routerの型定義を生成        |
| `db:generate`        | 共通     | Drizzleでマイグレーションファイルを生成     |
| `db:generate:custom` | 共通     | カスタム名でマイグレーションファイルを生成  |
| `db:migrate`         | 共通     | Supabaseでマイグレーションを実行            |
| `db:seed`            | ローカル | データベースにシードデータを投入            |
| `db:start`           | ローカル | Supabaseローカル環境とEdge Functionsを起動  |
| `db:stop`            | ローカル | Supabaseローカル環境を停止                  |
| `db:reset`           | ローカル | Supabaseデータベースをリセット              |
| `db:secrets:dev`     | 開発     | Supabase開発環境にシークレットを設定        |
| `storybook`          | ローカル | Storybookの開発サーバーを起動               |
| `build-storybook`    | 共通     | Storybookをビルド                           |

## 🔗 参考リンク

- [Remix Documentation](https://remix.run/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)

## 🐛 トラブルシューティング

### よくある問題

**Docker関連のエラー**

```bash
# Dockerコンテナをリセット
npm run db:reset
```

**ポートが使用中のエラー**

```bash
# 使用中のポートを確認
lsof -i :3000
lsof -i :54321
```

**環境変数が読み込まれない**

- `.env.local` ファイルの場所と内容を確認
- アプリケーションを再起動
