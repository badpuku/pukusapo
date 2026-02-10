# Reservation Collector API

施設予約の収集・管理を行うAPIです。

## Base URL

```
https://automation.example.com
```

---

## エンドポイント一覧

| Method | Endpoint         | 説明               |
| ------ | ---------------- | ------------------ |
| GET    | `/`              | API情報の取得      |
| POST   | `/jobs`          | 収集ジョブの作成   |
| GET    | `/jobs/:id`      | ジョブ状態の取得   |
| POST   | `/reservations`  | 予約情報の保存     |
| GET    | `/reservations`  | 予約情報の取得     |

---

## GET /

API情報を取得します。

### Response

```json
{
  "status": "ok",
  "message": "Reservation Collector API",
  "endpoints": {
    "POST /jobs": "Create a new collection job",
    "GET /jobs/:id": "Get job status",
    "POST /reservations": "Save collected reservations",
    "GET /reservations": "Get reservations"
  }
}
```

---

## POST /jobs

GitHub Actions のワークフローを実行して、予約情報の収集ジョブを開始します。

### Request

リクエストボディは不要です。

### Response

**成功時 (202 Accepted)**

```json
{
  "success": true,
  "message": "Workflow triggered successfully",
  "status": 204
}
```

**失敗時 (500 Internal Server Error)**

```json
{
  "success": false,
  "error": "エラーメッセージ"
}
```

---

## GET /jobs/:id

指定されたワークフロー実行のステータスを取得します。

### Parameters

| Name | Type   | Description          |
| ---- | ------ | -------------------- |
| id   | number | ワークフロー実行のID |

### Response

```json
{
  "success": true,
  "message": "Workflow run status",
  "status": 200
}
```

---

## POST /reservations

収集した予約情報を保存します。

### Request Body

```json
{
  "accountId": "user123",
  "reservations": [
    {
      "date": "2026-02-15",
      "time": "10:00-12:00",
      "facilityName": "体育館A",
      "status": "confirmed"
    }
  ]
}
```

### Reservation Object

| Field        | Type   | Description        |
| ------------ | ------ | ------------------ |
| date         | string | 予約日 (YYYY-MM-DD)|
| time         | string | 時間帯             |
| facilityName | string | 施設名             |
| status       | string | 予約ステータス     |

### Status Values

| Value           | 説明       |
| --------------- | ---------- |
| confirmed       | 本予約     |
| cancelled       | 取消済み   |
| won             | 当選       |
| won_confirmed   | 当選確定   |
| lottery_pending | 抽選待ち   |
| lost            | 落選       |

### Response

```json
{
  "success": true,
  "message": "Reservations saved"
}
```

---

## GET /reservations

保存された予約情報を取得します。

### Response

```json
{
  "success": true,
  "message": "Reservations fetched"
}
```

---

## 環境変数

| Name              | Description                        |
| ----------------- | ---------------------------------- |
| GITHUB_TOKEN      | GitHub API アクセストークン        |
| GITHUB_REPO_OWNER | リポジトリのオーナー名             |
| GITHUB_REPO_NAME  | リポジトリ名                       |
