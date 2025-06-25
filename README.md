# puku-form

## クイックスタート

### 前提条件
- Docker が使用可能であること
- Clerk のアカウントを作成し、ローカル用の Application の準備が完了していること
- ローカル用の ngrok の準備が完了していること

### 前準備
1. `npm ci`
2. `npm run db:start`
3. http://127.0.0.1:54323/project/default で Supabase のダッシュボードが確認できます。
4. `ngrok http --url=your-url.ngrok-free.app 54321`

※ Supabase の初回起動はイメージのビルドから始まるので、時間がかかります

### vite

1. `npm run dev`
2. http://localhost:3000/

### wrangler

1. `npm run build`
2. `npm run start`
3. http://localhost:8788/

## [Clerk] ローカル用の Application の準備

## [ngrok] ローカル用の ngrok アカウントの準備

## Drizzle で素の SQL ファイルを生成

- `db:generate:custom` コマンドでランダムな名前の SQL ファイルを生成
- `drizzle-kit generate --custom --name=hoge` コマンドで指定した名前の SQL ファイルを生成

## 参考リンク

- [Remix docs](https://remix.run/docs)
- [Supabase Docs](https://supabase.com/docs)
