# pukusapo フォーム・イベント管理システム ER図

## ER図

```mermaid
erDiagram
    %% 既存テーブル（参照用）
    profiles {
        uuid id PK
        text user_id UK "Clerk User ID"
        bigint role_id FK
        text username UK
        text full_name
        text avatar_url
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    roles {
        bigserial id PK
        varchar code UK
        varchar name
        text description
        integer permission_level
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    %% フォーム関連テーブル
    forms {
        uuid id PK
        uuid created_by FK "作成者（profiles.id）"
        varchar title "フォームタイトル"
        text description "説明"
        text slug UK "URL用スラッグ"
        varchar status "draft/published/closed"
        jsonb settings "フォーム設定（JSON）"
        boolean is_template "テンプレートフラグ"
        integer max_submissions "最大提出数"
        timestamp publish_start_at "公開開始日時"
        timestamp publish_end_at "公開終了日時"
        timestamp created_at
        timestamp updated_at
    }

    events {
        uuid id PK
        uuid created_by FK "作成者（profiles.id）"
        varchar title "イベント名"
        text description "説明"
        varchar location "開催場所"
        timestamp start_at "開始日時"
        timestamp end_at "終了日時"
        integer capacity "定員"
        integer waitlist_capacity "キャンセル待ち定員"
        varchar status "draft/published/in_progress/completed/cancelled"
        jsonb settings "イベント設定（JSON）"
        timestamp created_at
        timestamp updated_at
    }

    form_events {
        uuid form_id PK_FK
        uuid event_id PK_FK
        boolean is_required "イベント参加必須フラグ"
        integer priority "表示順序"
        timestamp created_at
    }

    form_fields {
        uuid id PK
        uuid form_id FK
        varchar field_type "text/email/tel/select/checkbox/radio/textarea/date/file"
        varchar label "フィールドラベル"
        text description "説明文"
        boolean is_required "必須フラグ"
        integer display_order "表示順序"
        jsonb validation_rules "バリデーションルール（JSON）"
        jsonb field_options "選択肢等のオプション（JSON）"
        timestamp created_at
        timestamp updated_at
    }

    form_submissions {
        uuid id PK
        uuid form_id FK
        uuid submitted_by FK "提出者（profiles.id）"
        varchar status "draft/submitted/approved/rejected"
        text notes "管理者メモ"
        timestamp submitted_at "提出日時"
        timestamp created_at
        timestamp updated_at
    }

    form_submission_answers {
        uuid id PK
        uuid submission_id FK
        uuid field_id FK
        text answer_text "テキスト回答"
        jsonb answer_data "構造化回答データ（JSON）"
        timestamp created_at
        timestamp updated_at
    }

    event_participations {
        uuid id PK
        uuid event_id FK
        uuid profile_id FK
        uuid submission_id FK "関連する提出（任意）"
        varchar status "registered/attended/cancelled/no_show"
        text cancellation_reason "キャンセル理由"
        timestamp registered_at "登録日時"
        timestamp cancelled_at "キャンセル日時"
        timestamp created_at
        timestamp updated_at
    }

    waitlists {
        uuid id PK
        uuid event_id FK
        uuid profile_id FK
        integer position "待機順位"
        varchar status "waiting/offered/accepted/declined/expired"
        timestamp offered_at "案内送信日時"
        timestamp expires_at "案内有効期限"
        timestamp accepted_at "受諾日時"
        timestamp created_at
        timestamp updated_at
    }

    %% リレーションシップ
    profiles ||--o{ forms : "creates"
    profiles ||--o{ events : "creates"
    profiles ||--o{ form_submissions : "submits"
    profiles ||--o{ event_participations : "participates"
    profiles ||--o{ waitlists : "waits"

    roles ||--o{ profiles : "has_role"

    forms ||--o{ form_events : "associated_with"
    forms ||--o{ form_fields : "has_fields"
    forms ||--o{ form_submissions : "receives"

    events ||--o{ form_events : "associated_with"
    events ||--o{ event_participations : "has_participations"
    events ||--o{ waitlists : "has_waitlist"

    form_fields ||--o{ form_submission_answers : "answered_in"

    form_submissions ||--o{ form_submission_answers : "contains"
    form_submissions ||--o{ event_participations : "linked_to"
```

## テーブル概要

### 既存テーブル
- **profiles**: ユーザープロフィール情報
- **roles**: ユーザーロール（RBAC）

### 新規テーブル

#### フォーム関連
- **forms**: フォームの基本情報（タイトル、説明、公開状態など）
- **form_fields**: フォームの入力項目（項目タイプ、ラベル、バリデーションなど）
- **form_submissions**: フォームの提出記録
- **form_submission_answers**: 各項目への回答内容

#### イベント関連
- **events**: イベントの基本情報（タイトル、日時、場所、定員など）
- **event_participations**: イベントへの参加状況
- **waitlists**: イベントのキャンセル待ちリスト

#### 関連テーブル
- **form_events**: フォームとイベントの多対多関連（複合主キー：form_id, event_id）

## 主要なリレーションシップ

### ユーザー関連
- ユーザー（profiles）は複数のフォームを作成できる（1対多）
- ユーザー（profiles）は複数のイベントを作成できる（1対多）
- ユーザー（profiles）は複数のフォームを提出できる（1対多）
- ユーザー（profiles）は複数のイベントに参加できる（1対多）

### フォーム・イベント関連
- フォームとイベントは多対多の関係（form_eventsを介する）
- 1つのフォームは複数のイベントに紐付けられる
- 1つのイベントは複数のフォームに紐付けられる

### 提出・回答関連
- フォーム提出（form_submissions）は複数の回答（form_submission_answers）を持つ（1対多）
- フォーム提出は複数のイベント参加（event_participations）に紐付けられる（1対多）

### 定員管理
- イベント（events）は複数の参加者（event_participations）を持つ（1対多）
- イベント（events）は複数のキャンセル待ち（waitlists）を持つ（1対多）
