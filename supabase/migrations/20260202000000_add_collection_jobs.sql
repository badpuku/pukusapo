-- ============================================================================
-- 収集ジョブ管理テーブル マイグレーション
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. 収集ジョブテーブル
-- ----------------------------------------------------------------------------

CREATE TABLE public.collection_jobs (
  id            serial      NOT NULL,
  collected_at  timestamptz NOT NULL DEFAULT now(),
  status        varchar(20) NOT NULL DEFAULT 'completed',
  created_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT pk_collection_jobs PRIMARY KEY (id),
  CONSTRAINT ck_collection_jobs_status CHECK (status IN ('running', 'completed', 'failed'))
);

COMMENT ON TABLE public.collection_jobs IS '予約情報収集ジョブを管理するテーブル';
COMMENT ON COLUMN public.collection_jobs.id IS '収集ジョブID（連番）';
COMMENT ON COLUMN public.collection_jobs.collected_at IS '収集実行日時';
COMMENT ON COLUMN public.collection_jobs.status IS 'ジョブ状態（running: 実行中, completed: 完了, failed: 失敗）';

-- ----------------------------------------------------------------------------
-- 2. facility_reservations に collection_job_id を追加
-- ----------------------------------------------------------------------------

ALTER TABLE public.facility_reservations
  ADD COLUMN collection_job_id integer REFERENCES public.collection_jobs(id) ON DELETE CASCADE;

COMMENT ON COLUMN public.facility_reservations.collection_job_id IS '収集ジョブID（collection_jobs.id）';

-- ----------------------------------------------------------------------------
-- 3. インデックス追加
-- ----------------------------------------------------------------------------

CREATE INDEX idx_facility_reservations_collection_job_id
  ON public.facility_reservations(collection_job_id);

-- ----------------------------------------------------------------------------
-- 4. ユニーク制約の変更
-- ----------------------------------------------------------------------------

-- 既存のユニーク制約を削除（同じ予約が別ジョブで取れるため）
ALTER TABLE public.facility_reservations
  DROP CONSTRAINT uq_facility_reservations_account_facility_datetime;

-- 新しいユニーク制約（ジョブごとに一意）
ALTER TABLE public.facility_reservations
  ADD CONSTRAINT uq_facility_reservations_job_account_facility_datetime
  UNIQUE (collection_job_id, facility_account_id, facility_name, reservation_date, reservation_time);
