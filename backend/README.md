# Backend

Rails 8.1 API（Ruby 3.4.8）

## セットアップ

```bash
cd backend
cp .env.local.example .env.local  # 環境変数を設定
bundle install
bin/rails db:setup
bin/rails server  # http://localhost:3001
```

## 環境変数

`.env.local.example` を参照。

| 変数名 | 説明 |
|---|---|
| `DATABASE_URL` | PostgreSQL 接続 URL（ローカルは Supabase CLI） |
| `CLERK_SECRET_KEY` | Clerk の Secret Key |
| `CLERK_PUBLISHABLE_KEY` | Clerk の Publishable Key |
