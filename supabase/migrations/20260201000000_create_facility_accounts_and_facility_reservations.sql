-- ============================================================================
-- 施設予約アカウント・抽選結果管理システム マイグレーション
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. 施設予約アカウントテーブル
-- ----------------------------------------------------------------------------

-- 施設予約サイトのアカウント情報を管理するテーブル
CREATE TABLE public.facility_accounts (
  id                   uuid         NOT NULL DEFAULT gen_random_uuid(),
  profile_id           uuid         NOT NULL,
  user_id              varchar(20)  NOT NULL,
  encrypted_password   text,
  circle_name          varchar(100),
  representative_name  varchar(100),
  created_at           timestamptz  NOT NULL DEFAULT now(),
  updated_at           timestamptz  NOT NULL DEFAULT now(),

  -- 制約定義
  CONSTRAINT pk_facility_accounts PRIMARY KEY (id),
  CONSTRAINT fk_facility_accounts_profile_id
    FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT ck_facility_accounts_user_id_format CHECK (user_id ~ '^\d{8}$'),
  CONSTRAINT uq_facility_accounts_profile_user UNIQUE (profile_id, user_id)
);

-- 施設予約アカウントテーブルのコメント
COMMENT ON TABLE public.facility_accounts IS '施設予約サイトのアカウント情報を管理するテーブル';
COMMENT ON COLUMN public.facility_accounts.profile_id IS 'アカウント所有者（profiles.id）';
COMMENT ON COLUMN public.facility_accounts.user_id IS '施設予約サイトのユーザーID（8桁数字）';
COMMENT ON COLUMN public.facility_accounts.encrypted_password IS 'AES暗号化されたパスワード（暗号化キーはVaultで管理）';
COMMENT ON COLUMN public.facility_accounts.circle_name IS 'サークル名';
COMMENT ON COLUMN public.facility_accounts.representative_name IS '代表者名';

-- ----------------------------------------------------------------------------
-- 2. 抽選結果テーブル
-- ----------------------------------------------------------------------------

-- 施設予約の抽選結果を管理するテーブル
CREATE TABLE public.facility_reservations (
  id                   uuid         NOT NULL DEFAULT gen_random_uuid(),
  facility_account_id  uuid         NOT NULL,
  facility_name        varchar(200) NOT NULL,
  reservation_date     date         NOT NULL,
  reservation_time     varchar(50)  NOT NULL,
  status               varchar(20)  NOT NULL,
  created_at           timestamptz  NOT NULL DEFAULT now(),
  updated_at           timestamptz  NOT NULL DEFAULT now(),

  -- 制約定義
  CONSTRAINT pk_facility_reservations PRIMARY KEY (id),
  CONSTRAINT fk_facility_reservations_facility_account_id
    FOREIGN KEY (facility_account_id) REFERENCES public.facility_accounts(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT ck_facility_reservations_status CHECK (
    status IN ('confirmed', 'cancelled', 'won', 'won_confirmed', 'lottery_pending', 'lost')
  ),
  CONSTRAINT ck_facility_reservations_facility_name_not_empty CHECK (length(trim(facility_name)) > 0),
  CONSTRAINT ck_facility_reservations_reservation_time_not_empty CHECK (length(trim(reservation_time)) > 0),
  CONSTRAINT uq_facility_reservations_account_facility_datetime UNIQUE (
    facility_account_id, facility_name, reservation_date, reservation_time
  )
);

-- 抽選結果テーブルのコメント
COMMENT ON TABLE public.facility_reservations IS '施設予約の抽選結果を管理するテーブル';
COMMENT ON COLUMN public.facility_reservations.facility_account_id IS '予約に使用したアカウント（facility_accounts.id）';
COMMENT ON COLUMN public.facility_reservations.facility_name IS '施設名';
COMMENT ON COLUMN public.facility_reservations.reservation_date IS '予約日';
COMMENT ON COLUMN public.facility_reservations.reservation_time IS '予約時間帯（例: "09:00-11:00"）';
COMMENT ON COLUMN public.facility_reservations.status IS '予約状態（confirmed: 本予約, cancelled: 取消済み, won: 当選, won_confirmed: 当選確定, lottery_pending: 抽選待ち, lost: 落選）';

-- ----------------------------------------------------------------------------
-- 3. インデックス定義
-- ----------------------------------------------------------------------------

-- 施設予約アカウントテーブル
CREATE INDEX idx_facility_accounts_profile_id ON public.facility_accounts(profile_id);

-- 抽選結果テーブル
CREATE INDEX idx_facility_reservations_facility_account_id ON public.facility_reservations(facility_account_id);
CREATE INDEX idx_facility_reservations_date ON public.facility_reservations(reservation_date);
CREATE INDEX idx_facility_reservations_status ON public.facility_reservations(status);
CREATE INDEX idx_facility_reservations_account_date ON public.facility_reservations(facility_account_id, reservation_date);

-- ----------------------------------------------------------------------------
-- 4. updated_atトリガー設定
-- ----------------------------------------------------------------------------

CREATE TRIGGER tr_facility_accounts_updated_at
  BEFORE UPDATE ON public.facility_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER tr_facility_reservations_updated_at
  BEFORE UPDATE ON public.facility_reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 5. Row Level Security (RLS) 設定
-- ----------------------------------------------------------------------------

-- RLS有効化
ALTER TABLE public.facility_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_reservations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 施設予約アカウントテーブルのRLSポリシー
-- ============================================================================

-- SELECT: 自分のアカウントのみ参照可能、管理者は全件参照可能
CREATE POLICY "facility_accounts_select_policy" ON public.facility_accounts
  FOR SELECT USING (
    profile_id = (SELECT id FROM public.profiles WHERE user_id = public.get_current_user_id())
    OR public.is_admin()
  );

-- INSERT: 自分のアカウントとしてのみ作成可能
CREATE POLICY "facility_accounts_insert_policy" ON public.facility_accounts
  FOR INSERT WITH CHECK (
    profile_id = (SELECT id FROM public.profiles WHERE user_id = public.get_current_user_id())
  );

-- UPDATE: 自分のアカウントのみ更新可能、管理者は全件更新可能
CREATE POLICY "facility_accounts_update_policy" ON public.facility_accounts
  FOR UPDATE USING (
    profile_id = (SELECT id FROM public.profiles WHERE user_id = public.get_current_user_id())
    OR public.is_admin()
  );

-- DELETE: 自分のアカウントのみ削除可能、管理者は全件削除可能
CREATE POLICY "facility_accounts_delete_policy" ON public.facility_accounts
  FOR DELETE USING (
    profile_id = (SELECT id FROM public.profiles WHERE user_id = public.get_current_user_id())
    OR public.is_admin()
  );

-- ============================================================================
-- 抽選結果テーブルのRLSポリシー
-- ============================================================================

-- SELECT: 自分のアカウントに紐づく予約のみ参照可能、管理者は全件参照可能
CREATE POLICY "facility_reservations_select_policy" ON public.facility_reservations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.facility_accounts
      WHERE id = facility_reservations.facility_account_id
      AND profile_id = (SELECT id FROM public.profiles WHERE user_id = public.get_current_user_id())
    )
    OR public.is_admin()
  );

-- INSERT: 自分のアカウントに紐づく予約のみ作成可能
CREATE POLICY "facility_reservations_insert_policy" ON public.facility_reservations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.facility_accounts
      WHERE id = facility_reservations.facility_account_id
      AND profile_id = (SELECT id FROM public.profiles WHERE user_id = public.get_current_user_id())
    )
    OR public.is_admin()
  );

-- UPDATE: 自分のアカウントに紐づく予約のみ更新可能、管理者は全件更新可能
CREATE POLICY "facility_reservations_update_policy" ON public.facility_reservations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.facility_accounts
      WHERE id = facility_reservations.facility_account_id
      AND profile_id = (SELECT id FROM public.profiles WHERE user_id = public.get_current_user_id())
    )
    OR public.is_admin()
  );

-- DELETE: 管理者のみ削除可能
CREATE POLICY "facility_reservations_delete_policy" ON public.facility_reservations
  FOR DELETE USING (public.is_admin());
