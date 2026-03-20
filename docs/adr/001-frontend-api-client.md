# ADR-001: フロントエンドから Rails API を呼ぶための共通クライアント設計

- **ステータス**: 承認済み
- **日付**: 2026-03-19
- **決定者**: m_sena

## コンテキスト

pukusapo のフロントエンドは Supabase に直接アクセスしてデータを取得している。現在、この通信を Rails backend API 経由に移行中であり、`profiles/me` が最初の対象である。

移行にあたり、以下を設計する必要がある。

1. **認証トークンの受け渡し**: Rails API は Clerk JWT を `Authorization: Bearer` ヘッダーで受け取る。フロントエンドのどの層でトークンを取得し、どう渡すか
2. **共通 HTTP クライアント**: API が増えるたびにボイラープレートが増殖しないよう、共通の fetch ラッパーが必要
3. **エラーハンドリング**: Rails API のエラーレスポンスをフロントエンドでどう扱うか

### 既存アーキテクチャ

```
loader → service → repository → Supabase
```

- `BaseAuthContext` には `userId`, `supabase`, `env` がある（トークンはない）
- `authenticate()` で `getAuth(args)` を呼び、context を構築
- Repository 層は `{ data, error }` タプルを返し、service 層で判定する
- `API_ENDPOINT_URL` は wrangler.jsonc に定義済み（本番・開発・ローカル）

## 決定ドライバー

1. **既存パターンとの一貫性**: 現在の `loader → service → repository` の流れを大きく壊さないこと
2. **ボイラープレートの最小化**: API エンドポイントが増えても同じコードを繰り返さないこと
3. **テスタビリティ**: service 層・api 層それぞれを独立してテストできること
4. **移行期の共存**: Supabase 直接アクセスと Rails API 経由が一時的に混在することへの対応

## 決定

### 1. `BaseAuthContext` に `token` を追加する

```typescript
interface BaseAuthContext {
  userId: string;
  supabase: SupabaseClient<Database>;
  env: Cloudflare.Env;
  token: string;  // ← 追加
}
```

`authenticate()` 内で `getAuth(args).getToken()` を呼び、context に含める。

#### 検討した代替案

- **api 層で都度 `getToken()` を呼ぶ**: api 層が `LoaderFunctionArgs` に依存し、関心の分離が崩れる。テスト時にトークンを差し替えにくい。却下

#### 理由

- 移行が進めば Supabase 依存が減り、`token` が主要な認証情報になる。context に持つのが自然
- 既存の service への影響は型にフィールドが増えるだけで、破壊的変更ではない
- テスト時にトークンを自由に差し替えられる

### 2. ファクトリ型の共通 HTTP クライアントを採用する

`app/lib/apiClient.server.ts` に `createApiClient` を作成する。

```typescript
interface ApiClient {
  get<T>(path: string): Promise<ApiResult<T>>;
  post<T>(path: string, body: unknown): Promise<ApiResult<T>>;
  put<T>(path: string, body: unknown): Promise<ApiResult<T>>;
  delete<T>(path: string): Promise<ApiResult<T>>;
}

function createApiClient(ctx: BaseAuthContext): ApiClient;
```

#### 検討した代替案

- **単純な関数 `apiFetch(path, { env, token, method, body })`**: 呼び出しごとに `env` と `token` を渡す必要がある。API が増えるほど冗長になる
- **`BaseAuthContext` に `api` プロパティとして含める**: context が肥大化し、データとクライアントの責務が混在する

#### 理由

- context を1回渡せば、以降 `env` や `token` を意識せずに使える
- api 層（`app/api/`）は `ApiClient` interface だけ知っていればよく、`BaseAuthContext` に依存しない
- テスト時に `ApiClient` を interface ごとモックできる

#### クライアント生成場所

service 内で `const api = createApiClient(ctx)` として生成する。context はデータだけ持ち、クライアントの生成は使う側に任せる方が責務が明確。

### 3. エラーハンドリングは Result 型を採用する

```typescript
type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string };
```

#### 検討した代替案

- **throw（例外パターン）**: 正常系はすっきり書けるが、既存コードに try/catch パターンがなく異質
- **Response をそのまま返す**: service 層に判断を委ねるため柔軟だが、毎回パースが必要で冗長

#### 理由

- 既存の Supabase パターン（`{ data, error }` を返し、service で判定）と同じ流れで書ける
- 型安全に成功・失敗を判定できる

## 呼び出しフローの全体像

```
loader
  → service（createApiClient(ctx) でクライアント生成）
    → api 層（ApiClient を受け取り、パスを指定して呼ぶ）
      → createApiClient 内部の fetch（共通ヘッダー付与・エラー変換）
        → Rails API
```

```typescript
// app/api/profiles.server.ts
export const fetchMyProfile = (api: ApiClient) =>
  api.get<ProfileResponse>("/v1/profiles/me");

// app/services/profiles/get.server.ts
export const getMyProfileService = async (ctx: BaseAuthContext) => {
  const api = createApiClient(ctx);
  const result = await fetchMyProfile(api);
  if (!result.ok) return createErrorResponse(...);
  // ...
};
```

## 実装の影響範囲

| ファイル | 変更内容 |
|----------|----------|
| `app/lib/auth/types.ts` | `BaseAuthContext` に `token: string` 追加 |
| `app/lib/auth/context.server.ts` | `authenticate()` で `getToken()` を呼んで context に含める |
| `app/lib/apiClient.server.ts` | 新規作成（`createApiClient`, `ApiClient`, `ApiResult`） |
| `app/api/profiles.server.ts` | `fetchMyProfile` を実装 |

## 補足: 移行期の方針

- 新規の API 呼び出しは Rails API 経由（`createApiClient` を使用）
- 既存の Supabase 直接アクセスは、各機能の移行完了まで維持
- 移行完了後、`BaseAuthContext` から `supabase` フィールドを削除する
