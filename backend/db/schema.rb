# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_02_22_000000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "extensions.pg_stat_statements"
  enable_extension "extensions.pgcrypto"
  enable_extension "extensions.uuid-ossp"
  enable_extension "graphql.pg_graphql"
  enable_extension "pg_catalog.plpgsql"
  enable_extension "vault.supabase_vault"

  create_table "collection_jobs", id: { type: :serial, comment: "収集ジョブID（連番）" }, comment: "予約情報収集ジョブを管理するテーブル", force: :cascade do |t|
    t.timestamptz "created_at", default: -> { "now()" }, null: false
    t.string "status", limit: 20, default: "running", null: false, comment: "ジョブ状態（running: 実行中, completed: 完了, failed: 失敗）"
    t.timestamptz "updated_at", default: -> { "now()" }, null: false, comment: "最終更新日時"
    t.check_constraint "status::text = ANY (ARRAY['running'::character varying, 'completed'::character varying, 'failed'::character varying]::text[])", name: "ck_collection_jobs_status"
  end

  create_table "event_participations", id: :uuid, default: -> { "gen_random_uuid()" }, comment: "イベントへの参加状況を管理するテーブル", force: :cascade do |t|
    t.text "cancellation_reason", comment: "キャンセル理由"
    t.timestamptz "cancelled_at"
    t.timestamptz "created_at", default: -> { "now()" }, null: false
    t.uuid "event_id", null: false
    t.uuid "profile_id", null: false
    t.timestamptz "registered_at", default: -> { "now()" }, null: false
    t.string "status", limit: 20, default: "registered", null: false, comment: "参加状態（registered: 登録済み, attended: 参加, cancelled: キャンセル, no_show: 欠席）"
    t.uuid "submission_id", comment: "関連するフォーム提出（任意）"
    t.timestamptz "updated_at", default: -> { "now()" }, null: false
    t.index ["event_id", "status"], name: "idx_event_participations_status"
    t.index ["event_id"], name: "idx_event_participations_event_id"
    t.index ["profile_id"], name: "idx_event_participations_profile_id"
    t.check_constraint "status::text = ANY (ARRAY['registered'::character varying, 'attended'::character varying, 'cancelled'::character varying, 'no_show'::character varying]::text[])", name: "ck_event_participations_status"
    t.unique_constraint ["event_id", "profile_id"], name: "uq_event_participations_event_profile"
  end

  create_table "events", id: :uuid, default: -> { "gen_random_uuid()" }, comment: "イベントの基本情報を管理するテーブル", force: :cascade do |t|
    t.integer "capacity", null: false, comment: "イベントの定員（正の整数）"
    t.timestamptz "created_at", default: -> { "now()" }, null: false
    t.uuid "created_by", null: false, comment: "イベント作成者（profiles.id）"
    t.text "description"
    t.timestamptz "end_at", null: false
    t.string "location", limit: 200
    t.timestamptz "start_at", null: false
    t.string "status", limit: 20, default: "draft", null: false, comment: "イベントの状態（draft: 下書き, published: 公開中, in_progress: 開催中, completed: 終了, cancelled: 中止）"
    t.string "title", limit: 200, null: false
    t.timestamptz "updated_at", default: -> { "now()" }, null: false
    t.integer "waitlist_capacity", default: 0, null: false, comment: "キャンセル待ちの定員（0以上）"
    t.index ["created_by"], name: "idx_events_created_by"
    t.index ["start_at", "end_at"], name: "idx_events_dates"
    t.index ["status"], name: "idx_events_status", where: "((status)::text = ANY ((ARRAY['published'::character varying, 'in_progress'::character varying])::text[]))"
    t.check_constraint "capacity > 0", name: "ck_events_capacity"
    t.check_constraint "length(TRIM(BOTH FROM title)) > 0", name: "ck_events_title_not_empty"
    t.check_constraint "start_at < end_at", name: "ck_events_dates"
    t.check_constraint "status::text = ANY (ARRAY['draft'::character varying, 'published'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'cancelled'::character varying]::text[])", name: "ck_events_status"
    t.check_constraint "waitlist_capacity >= 0", name: "ck_events_waitlist_capacity"
  end

  create_table "facility_accounts", id: :uuid, default: -> { "gen_random_uuid()" }, comment: "施設予約サイトのアカウント情報を管理するテーブル", force: :cascade do |t|
    t.string "circle_name", limit: 100, comment: "サークル名"
    t.timestamptz "created_at", default: -> { "now()" }, null: false
    t.text "encrypted_password", comment: "AES暗号化されたパスワード（暗号化キーはVaultで管理）"
    t.uuid "profile_id", null: false, comment: "アカウント所有者（profiles.id）"
    t.string "representative_name", limit: 100, comment: "代表者名"
    t.timestamptz "updated_at", default: -> { "now()" }, null: false
    t.string "user_id", limit: 20, null: false, comment: "施設予約サイトのユーザーID（8桁数字）"
    t.index ["profile_id"], name: "idx_facility_accounts_profile_id"
    t.check_constraint "user_id::text ~ '^\\d{8}$'::text", name: "ck_facility_accounts_user_id_format"
    t.unique_constraint ["profile_id", "user_id"], name: "uq_facility_accounts_profile_user"
  end

  create_table "facility_reservations", id: :uuid, default: -> { "gen_random_uuid()" }, comment: "施設予約の抽選結果を管理するテーブル", force: :cascade do |t|
    t.integer "collection_job_id", comment: "収集ジョブID（collection_jobs.id）"
    t.timestamptz "created_at", default: -> { "now()" }, null: false
    t.uuid "facility_account_id", null: false, comment: "予約に使用したアカウント（facility_accounts.id）"
    t.string "facility_name", limit: 200, null: false, comment: "施設名"
    t.date "reservation_date", null: false, comment: "予約日"
    t.string "reservation_time", limit: 50, null: false, comment: "予約時間帯（例: \"09:00-11:00\"）"
    t.string "status", limit: 20, null: false, comment: "予約状態（confirmed: 本予約, cancelled: 取消済み, won: 当選, won_confirmed: 当選確定, lottery_pending: 抽選待ち, lost: 落選）"
    t.timestamptz "updated_at", default: -> { "now()" }, null: false
    t.index ["collection_job_id"], name: "idx_facility_reservations_collection_job_id"
    t.index ["facility_account_id", "reservation_date"], name: "idx_facility_reservations_account_date"
    t.index ["facility_account_id"], name: "idx_facility_reservations_facility_account_id"
    t.index ["reservation_date"], name: "idx_facility_reservations_date"
    t.index ["status"], name: "idx_facility_reservations_status"
    t.check_constraint "length(TRIM(BOTH FROM facility_name)) > 0", name: "ck_facility_reservations_facility_name_not_empty"
    t.check_constraint "length(TRIM(BOTH FROM reservation_time)) > 0", name: "ck_facility_reservations_reservation_time_not_empty"
    t.check_constraint "status::text = ANY (ARRAY['confirmed'::character varying, 'cancelled'::character varying, 'won'::character varying, 'won_confirmed'::character varying, 'lottery_pending'::character varying, 'lost'::character varying]::text[])", name: "ck_facility_reservations_status"
    t.unique_constraint ["collection_job_id", "facility_account_id", "facility_name", "reservation_date", "reservation_time"], name: "uq_facility_reservations_job_account_facility_datetime"
  end

  create_table "form_events", primary_key: ["form_id", "event_id"], comment: "フォームとイベントの多対多関連を管理するテーブル", force: :cascade do |t|
    t.timestamptz "created_at", default: -> { "now()" }, null: false
    t.uuid "event_id", null: false
    t.uuid "form_id", null: false
    t.boolean "is_required", default: false, null: false, comment: "イベント参加にこのフォームの提出が必須かどうか"
    t.integer "priority", default: 0, null: false, comment: "表示順序（小さい値ほど優先）"
    t.check_constraint "priority >= 0", name: "ck_form_events_priority"
  end

  create_table "form_fields", id: :uuid, default: -> { "gen_random_uuid()" }, comment: "フォームの入力項目を管理するテーブル", force: :cascade do |t|
    t.timestamptz "created_at", default: -> { "now()" }, null: false
    t.text "description"
    t.integer "display_order", default: 0, null: false
    t.jsonb "field_options", comment: "フィールド固有のオプション（選択肢など、JSON形式）"
    t.string "field_type", limit: 20, null: false, comment: "項目タイプ（text: テキスト, email: メール, tel: 電話, select: 選択, checkbox: チェックボックス, radio: ラジオボタン, textarea: テキストエリア）"
    t.uuid "form_id", null: false
    t.boolean "is_required", default: false, null: false
    t.string "label", limit: 200, null: false
    t.timestamptz "updated_at", default: -> { "now()" }, null: false
    t.jsonb "validation_rules", comment: "バリデーションルール（JSON形式）"
    t.index ["form_id", "display_order"], name: "idx_form_fields_display_order"
    t.index ["form_id"], name: "idx_form_fields_form_id"
    t.check_constraint "display_order >= 0", name: "ck_form_fields_display_order"
    t.check_constraint "field_type::text = ANY (ARRAY['text'::character varying, 'email'::character varying, 'tel'::character varying, 'select'::character varying, 'checkbox'::character varying, 'radio'::character varying, 'textarea'::character varying]::text[])", name: "ck_form_fields_type"
    t.check_constraint "length(TRIM(BOTH FROM label)) > 0", name: "ck_form_fields_label_not_empty"
  end

  create_table "form_submission_answers", id: :uuid, default: -> { "gen_random_uuid()" }, comment: "各フォーム項目への回答を管理するテーブル", force: :cascade do |t|
    t.jsonb "answer_data", comment: "構造化された回答データ（JSON形式）"
    t.text "answer_text", comment: "テキスト形式の回答"
    t.timestamptz "created_at", default: -> { "now()" }, null: false
    t.uuid "field_id", null: false
    t.uuid "submission_id", null: false
    t.timestamptz "updated_at", default: -> { "now()" }, null: false
    t.index ["field_id"], name: "idx_form_submission_answers_field_id"
    t.index ["submission_id"], name: "idx_form_submission_answers_submission_id"
    t.unique_constraint ["submission_id", "field_id"], name: "uq_form_submission_answers_submission_field"
  end

  create_table "form_submissions", id: :uuid, default: -> { "gen_random_uuid()" }, comment: "フォームの提出記録を管理するテーブル", force: :cascade do |t|
    t.timestamptz "created_at", default: -> { "now()" }, null: false
    t.uuid "form_id", null: false
    t.string "status", limit: 20, default: "draft", null: false, comment: "提出の状態（draft: 下書き, submitted: 提出済み, approved: 承認, rejected: 却下）"
    t.timestamptz "submitted_at", comment: "正式提出日時（draftの場合はNULL）"
    t.uuid "submitted_by", null: false, comment: "提出者（profiles.id）"
    t.timestamptz "updated_at", default: -> { "now()" }, null: false
    t.index ["form_id"], name: "idx_form_submissions_form_id"
    t.index ["status"], name: "idx_form_submissions_status"
    t.index ["submitted_by"], name: "idx_form_submissions_submitted_by"
    t.check_constraint "status::text = ANY (ARRAY['draft'::character varying, 'submitted'::character varying, 'approved'::character varying, 'rejected'::character varying]::text[])", name: "ck_form_submissions_status"
  end

  create_table "forms", id: :uuid, default: -> { "gen_random_uuid()" }, comment: "フォームの基本情報を管理するテーブル", force: :cascade do |t|
    t.timestamptz "created_at", default: -> { "now()" }, null: false
    t.uuid "created_by", null: false, comment: "フォーム作成者（profiles.id）"
    t.text "description"
    t.timestamptz "publish_end_at", comment: "公開終了日時（NULLの場合は無期限）"
    t.timestamptz "publish_start_at", comment: "公開開始日時（NULLの場合は即時公開）"
    t.string "status", limit: 20, default: "draft", null: false, comment: "フォームの状態（draft: 下書き, published: 公開中, closed: 終了）"
    t.string "title", limit: 200, null: false
    t.timestamptz "updated_at", default: -> { "now()" }, null: false
    t.index ["created_by"], name: "idx_forms_created_by"
    t.index ["publish_start_at", "publish_end_at"], name: "idx_forms_publish_dates", where: "(publish_start_at IS NOT NULL)"
    t.index ["status"], name: "idx_forms_status", where: "((status)::text = 'published'::text)"
    t.check_constraint "length(TRIM(BOTH FROM title)) > 0", name: "ck_forms_title_not_empty"
    t.check_constraint "publish_start_at IS NULL OR publish_end_at IS NULL OR publish_start_at < publish_end_at", name: "ck_forms_publish_dates"
    t.check_constraint "status::text = ANY (ARRAY['draft'::character varying, 'published'::character varying, 'closed'::character varying]::text[])", name: "ck_forms_status"
  end

  create_table "permissions", comment: "システム内で利用可能な権限を定義するマスタテーブル", force: :cascade do |t|
    t.string "action", limit: 50, null: false, comment: "リソースに対するアクション名"
    t.string "code", limit: 100, null: false, comment: "権限を識別する一意なコード（resource.action形式）"
    t.timestamptz "created_at", default: -> { "now()" }, null: false
    t.text "description"
    t.boolean "is_active", default: true, null: false
    t.string "name", limit: 200, null: false
    t.string "resource", limit: 50, null: false, comment: "アクセス対象のリソース名"
    t.timestamptz "updated_at", default: -> { "now()" }, null: false
    t.index ["code"], name: "idx_permissions_code_active", where: "(is_active = true)"
    t.index ["resource", "action"], name: "idx_permissions_resource_action", where: "(is_active = true)"
    t.check_constraint "action::text ~ '^[a-z][a-z0-9_]*$'::text", name: "ck_permissions_action_format"
    t.check_constraint "code::text ~ '^[a-z][a-z0-9_]*\\.[a-z][a-z0-9_]*$'::text", name: "ck_permissions_code_format"
    t.check_constraint "length(TRIM(BOTH FROM name)) > 0", name: "ck_permissions_name_not_empty"
    t.check_constraint "resource::text ~ '^[a-z][a-z0-9_]*$'::text", name: "ck_permissions_resource_format"
    t.unique_constraint ["code"], name: "uq_permissions_code"
    t.unique_constraint ["resource", "action"], name: "uq_permissions_resource_action"
  end

  create_table "profiles", id: :uuid, default: -> { "gen_random_uuid()" }, comment: "ユーザーのプロファイル情報とロール割り当てを管理するテーブル", force: :cascade do |t|
    t.text "avatar_url"
    t.timestamptz "created_at", default: -> { "now()" }, null: false
    t.text "full_name"
    t.boolean "is_active", default: true, null: false
    t.bigint "role_id", null: false, comment: "割り当てられたロールのID"
    t.timestamptz "updated_at", default: -> { "now()" }, null: false
    t.text "user_id", null: false, comment: "Clerk認証システムのユーザーID"
    t.text "username", comment: "ユーザー名（英数字、ハイフン、アンダースコアのみ、3文字以上30文字以下）"
    t.index ["role_id"], name: "idx_profiles_role_id", where: "(is_active = true)"
    t.index ["username"], name: "idx_profiles_username", where: "((username IS NOT NULL) AND (is_active = true))"
    t.check_constraint "avatar_url IS NULL OR avatar_url ~ '^https?://'::text", name: "ck_profiles_avatar_url_format"
    t.check_constraint "length(TRIM(BOTH FROM user_id)) > 0", name: "ck_profiles_user_id_not_empty"
    t.check_constraint "username IS NULL OR username ~ '^[a-zA-Z0-9_-]{3,30}$'::text", name: "ck_profiles_username_format"
    t.unique_constraint ["user_id"], name: "uq_profiles_user_id"
    t.unique_constraint ["username"], name: "uq_profiles_username"
  end

  create_table "role_permissions", primary_key: ["role_id", "permission_id"], comment: "ロールと権限の関連を管理するテーブル", force: :cascade do |t|
    t.timestamptz "granted_at", default: -> { "now()" }, null: false
    t.text "granted_by", comment: "権限を付与したユーザーのID"
    t.bigint "permission_id", null: false
    t.bigint "role_id", null: false
  end

  create_table "roles", comment: "システム内で利用可能なユーザーロールを定義するマスタテーブル", force: :cascade do |t|
    t.string "code", limit: 50, null: false, comment: "ロールを識別する一意なコード（小文字英数字とアンダースコアのみ）"
    t.timestamptz "created_at", default: -> { "now()" }, null: false
    t.text "description"
    t.boolean "is_active", default: true, null: false
    t.string "name", limit: 100, null: false, comment: "ユーザーに表示されるロール名"
    t.integer "permission_level", default: 0, null: false, comment: "権限レベル（0-100、数値が高いほど強い権限）"
    t.timestamptz "updated_at", default: -> { "now()" }, null: false
    t.index ["code"], name: "idx_roles_code_active", where: "(is_active = true)"
    t.index ["permission_level"], name: "idx_roles_permission_level", order: :desc, where: "(is_active = true)"
    t.check_constraint "code::text ~ '^[a-z][a-z0-9_]*$'::text", name: "ck_roles_code_format"
    t.check_constraint "length(TRIM(BOTH FROM name)) > 0", name: "ck_roles_name_not_empty"
    t.check_constraint "permission_level >= 0 AND permission_level <= 100", name: "ck_roles_permission_level_range"
    t.unique_constraint ["code"], name: "uq_roles_code"
  end

  create_table "solid_cable_messages", force: :cascade do |t|
    t.binary "channel", null: false
    t.bigint "channel_hash", null: false
    t.datetime "created_at", null: false
    t.binary "payload", null: false
    t.index ["channel"], name: "index_solid_cable_messages_on_channel"
    t.index ["channel_hash"], name: "index_solid_cable_messages_on_channel_hash"
    t.index ["created_at"], name: "index_solid_cable_messages_on_created_at"
  end

  create_table "solid_cache_entries", force: :cascade do |t|
    t.integer "byte_size", null: false
    t.datetime "created_at", null: false
    t.binary "key", null: false
    t.bigint "key_hash", null: false
    t.binary "value", null: false
    t.index ["byte_size"], name: "index_solid_cache_entries_on_byte_size"
    t.index ["key_hash", "byte_size"], name: "index_solid_cache_entries_on_key_hash_and_byte_size"
    t.index ["key_hash"], name: "index_solid_cache_entries_on_key_hash", unique: true
  end

  create_table "solid_queue_blocked_executions", force: :cascade do |t|
    t.string "concurrency_key", null: false
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.bigint "job_id", null: false
    t.integer "priority", default: 0, null: false
    t.string "queue_name", null: false
    t.index ["concurrency_key", "priority", "job_id"], name: "index_solid_queue_blocked_executions_for_release"
    t.index ["expires_at", "concurrency_key"], name: "index_solid_queue_blocked_executions_for_maintenance"
    t.index ["job_id"], name: "index_solid_queue_blocked_executions_on_job_id", unique: true
  end

  create_table "solid_queue_claimed_executions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "job_id", null: false
    t.bigint "process_id"
    t.index ["job_id"], name: "index_solid_queue_claimed_executions_on_job_id", unique: true
    t.index ["process_id", "job_id"], name: "index_solid_queue_claimed_executions_on_process_id_and_job_id"
  end

  create_table "solid_queue_failed_executions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "error"
    t.bigint "job_id", null: false
    t.index ["job_id"], name: "index_solid_queue_failed_executions_on_job_id", unique: true
  end

  create_table "solid_queue_jobs", force: :cascade do |t|
    t.string "active_job_id"
    t.text "arguments"
    t.string "class_name", null: false
    t.string "concurrency_key"
    t.datetime "created_at", null: false
    t.datetime "finished_at"
    t.integer "priority", default: 0, null: false
    t.string "queue_name", null: false
    t.datetime "scheduled_at"
    t.datetime "updated_at", null: false
    t.index ["active_job_id"], name: "index_solid_queue_jobs_on_active_job_id"
    t.index ["class_name"], name: "index_solid_queue_jobs_on_class_name"
    t.index ["finished_at"], name: "index_solid_queue_jobs_on_finished_at"
    t.index ["queue_name", "finished_at"], name: "index_solid_queue_jobs_for_filtering"
    t.index ["scheduled_at", "finished_at"], name: "index_solid_queue_jobs_for_alerting"
  end

  create_table "solid_queue_pauses", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "queue_name", null: false
    t.index ["queue_name"], name: "index_solid_queue_pauses_on_queue_name", unique: true
  end

  create_table "solid_queue_processes", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "hostname"
    t.string "kind", null: false
    t.datetime "last_heartbeat_at", null: false
    t.text "metadata"
    t.string "name", null: false
    t.integer "pid", null: false
    t.bigint "supervisor_id"
    t.index ["last_heartbeat_at"], name: "index_solid_queue_processes_on_last_heartbeat_at"
    t.index ["name", "supervisor_id"], name: "index_solid_queue_processes_on_name_and_supervisor_id", unique: true
    t.index ["supervisor_id"], name: "index_solid_queue_processes_on_supervisor_id"
  end

  create_table "solid_queue_ready_executions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "job_id", null: false
    t.integer "priority", default: 0, null: false
    t.string "queue_name", null: false
    t.index ["job_id"], name: "index_solid_queue_ready_executions_on_job_id", unique: true
    t.index ["priority", "job_id"], name: "index_solid_queue_poll_all"
    t.index ["queue_name", "priority", "job_id"], name: "index_solid_queue_poll_by_queue"
  end

  create_table "solid_queue_recurring_executions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "job_id", null: false
    t.datetime "run_at", null: false
    t.string "task_key", null: false
    t.index ["job_id"], name: "index_solid_queue_recurring_executions_on_job_id", unique: true
    t.index ["task_key", "run_at"], name: "index_solid_queue_recurring_executions_on_task_key_and_run_at", unique: true
  end

  create_table "solid_queue_recurring_tasks", force: :cascade do |t|
    t.text "arguments"
    t.string "class_name"
    t.string "command", limit: 2048
    t.datetime "created_at", null: false
    t.text "description"
    t.string "key", null: false
    t.integer "priority", default: 0
    t.string "queue_name"
    t.string "schedule", null: false
    t.boolean "static", default: true, null: false
    t.datetime "updated_at", null: false
    t.index ["key"], name: "index_solid_queue_recurring_tasks_on_key", unique: true
    t.index ["static"], name: "index_solid_queue_recurring_tasks_on_static"
  end

  create_table "solid_queue_scheduled_executions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "job_id", null: false
    t.integer "priority", default: 0, null: false
    t.string "queue_name", null: false
    t.datetime "scheduled_at", null: false
    t.index ["job_id"], name: "index_solid_queue_scheduled_executions_on_job_id", unique: true
    t.index ["scheduled_at", "priority", "job_id"], name: "index_solid_queue_dispatch_all"
  end

  create_table "solid_queue_semaphores", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.string "key", null: false
    t.datetime "updated_at", null: false
    t.integer "value", default: 1, null: false
    t.index ["expires_at"], name: "index_solid_queue_semaphores_on_expires_at"
    t.index ["key", "value"], name: "index_solid_queue_semaphores_on_key_and_value"
    t.index ["key"], name: "index_solid_queue_semaphores_on_key", unique: true
  end

  create_table "waitlists", id: :uuid, default: -> { "gen_random_uuid()" }, comment: "イベントのキャンセル待ちリストを管理するテーブル", force: :cascade do |t|
    t.timestamptz "accepted_at", comment: "受諾日時"
    t.timestamptz "created_at", default: -> { "now()" }, null: false
    t.uuid "event_id", null: false
    t.timestamptz "expires_at", comment: "参加案内の有効期限"
    t.timestamptz "offered_at", comment: "参加案内送信日時"
    t.integer "position", null: false, comment: "キャンセル待ちの順位（1から開始）"
    t.uuid "profile_id", null: false
    t.string "status", limit: 20, default: "waiting", null: false, comment: "キャンセル待ちの状態（waiting: 待機中, offered: 案内済み, accepted: 受諾, declined: 辞退, expired: 期限切れ）"
    t.timestamptz "updated_at", default: -> { "now()" }, null: false
    t.index ["event_id", "status", "position"], name: "idx_waitlists_status", where: "((status)::text = 'waiting'::text)"
    t.index ["event_id"], name: "idx_waitlists_event_id"
    t.index ["profile_id"], name: "idx_waitlists_profile_id"
    t.check_constraint "\"position\" > 0", name: "ck_waitlists_position"
    t.check_constraint "status::text = ANY (ARRAY['waiting'::character varying, 'offered'::character varying, 'accepted'::character varying, 'declined'::character varying, 'expired'::character varying]::text[])", name: "ck_waitlists_status"
    t.unique_constraint ["event_id", "position"], name: "uq_waitlists_event_position"
    t.unique_constraint ["event_id", "profile_id"], name: "uq_waitlists_event_profile"
  end

  add_foreign_key "event_participations", "events", name: "fk_event_participations_event_id", on_update: :cascade, on_delete: :cascade
  add_foreign_key "event_participations", "form_submissions", column: "submission_id", name: "fk_event_participations_submission_id", on_update: :cascade, on_delete: :nullify
  add_foreign_key "event_participations", "profiles", name: "fk_event_participations_profile_id", on_update: :cascade, on_delete: :restrict
  add_foreign_key "events", "profiles", column: "created_by", name: "fk_events_created_by", on_update: :cascade, on_delete: :restrict
  add_foreign_key "facility_accounts", "profiles", name: "fk_facility_accounts_profile_id", on_update: :cascade, on_delete: :cascade
  add_foreign_key "facility_reservations", "collection_jobs", name: "facility_reservations_collection_job_id_fkey", on_delete: :cascade
  add_foreign_key "facility_reservations", "facility_accounts", name: "fk_facility_reservations_facility_account_id", on_update: :cascade, on_delete: :cascade
  add_foreign_key "form_events", "events", name: "fk_form_events_event_id", on_update: :cascade, on_delete: :cascade
  add_foreign_key "form_events", "forms", name: "fk_form_events_form_id", on_update: :cascade, on_delete: :cascade
  add_foreign_key "form_fields", "forms", name: "fk_form_fields_form_id", on_update: :cascade, on_delete: :cascade
  add_foreign_key "form_submission_answers", "form_fields", column: "field_id", name: "fk_form_submission_answers_field_id", on_update: :cascade, on_delete: :restrict
  add_foreign_key "form_submission_answers", "form_submissions", column: "submission_id", name: "fk_form_submission_answers_submission_id", on_update: :cascade, on_delete: :cascade
  add_foreign_key "form_submissions", "forms", name: "fk_form_submissions_form_id", on_update: :cascade, on_delete: :restrict
  add_foreign_key "form_submissions", "profiles", column: "submitted_by", name: "fk_form_submissions_submitted_by", on_update: :cascade, on_delete: :restrict
  add_foreign_key "forms", "profiles", column: "created_by", name: "fk_forms_created_by", on_update: :cascade, on_delete: :restrict
  add_foreign_key "profiles", "roles", name: "fk_profiles_role_id", on_update: :cascade, on_delete: :restrict
  add_foreign_key "role_permissions", "permissions", name: "fk_role_permissions_permission_id", on_update: :cascade, on_delete: :cascade
  add_foreign_key "role_permissions", "roles", name: "fk_role_permissions_role_id", on_update: :cascade, on_delete: :cascade
  add_foreign_key "solid_queue_blocked_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_claimed_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_failed_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_ready_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_recurring_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "solid_queue_scheduled_executions", "solid_queue_jobs", column: "job_id", on_delete: :cascade
  add_foreign_key "waitlists", "events", name: "fk_waitlists_event_id", on_update: :cascade, on_delete: :cascade
  add_foreign_key "waitlists", "profiles", name: "fk_waitlists_profile_id", on_update: :cascade, on_delete: :restrict
end
