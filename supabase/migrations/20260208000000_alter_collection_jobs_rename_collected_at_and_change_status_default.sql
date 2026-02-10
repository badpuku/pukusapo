-- ============================================================================
-- collection_jobs テーブル修正
-- - collected_at → updated_at にリネーム
-- - status のデフォルト値を 'completed' → 'running' に変更
-- ============================================================================

-- collected_at を updated_at にリネーム
ALTER TABLE public.collection_jobs
  RENAME COLUMN collected_at TO updated_at;

COMMENT ON COLUMN public.collection_jobs.updated_at IS '最終更新日時';

-- status のデフォルト値を running に変更
ALTER TABLE public.collection_jobs
  ALTER COLUMN status SET DEFAULT 'running';
