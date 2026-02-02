```txt
npm install
npm run dev
```

```txt
npm run deploy
```

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
npm run cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiation `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```

## Scripts

### 施設アカウント一括登録

Google Sheets からアカウント情報を取得し、`facility_accounts` テーブルに一括登録する。

#### 環境変数

`.env` に以下を設定：

```bash
# Google Sheets
GOOGLE_SHEETS_ID=your-spreadsheet-id
GOOGLE_API_KEY=your-api-key
GOOGLE_SHEETS_NAME=Sheet1  # 省略可

# Supabase
SUPABASE_URL=https://xxxx.supabase.co  # 本番の場合
SUPABASE_ANON_KEY=your-anon-key

# 暗号化キー（frontend と同じ値を使用）
ENCRYPTION_KEY=your-encryption-key
```

#### 実行方法

```bash
# ローカル環境
cd automation
npm run seed:accounts

# 本番環境への投入（.env を本番用に設定後）
cd automation
npm run seed:accounts
```

#### 動作

1. admin 権限を持つ最古の profile を自動取得
2. Google Sheets からアカウント（userId, password）を取得
3. 既存アカウントと重複するものはスキップ
4. パスワードを AES-GCM で暗号化して INSERT
