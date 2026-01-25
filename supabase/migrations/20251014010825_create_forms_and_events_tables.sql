-- ============================================================================
-- フォーム・イベント管理システム マイグレーション
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. フォームテーブル
-- ----------------------------------------------------------------------------

-- フォームマスタテーブル
CREATE TABLE public.forms (
  id                 uuid        NOT NULL DEFAULT gen_random_uuid(),
  created_by         uuid        NOT NULL,
  title              varchar(200) NOT NULL,
  description        text,
  status             varchar(20)  NOT NULL DEFAULT 'draft',
  publish_start_at   timestamptz,
  publish_end_at     timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),

  -- 制約定義
  CONSTRAINT pk_forms PRIMARY KEY (id),
  CONSTRAINT fk_forms_created_by
    FOREIGN KEY (created_by) REFERENCES public.profiles(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT ck_forms_status CHECK (status IN ('draft', 'published', 'closed')),
  CONSTRAINT ck_forms_title_not_empty CHECK (length(trim(title)) > 0),
  CONSTRAINT ck_forms_publish_dates CHECK (
    publish_start_at IS NULL OR
    publish_end_at IS NULL OR
    publish_start_at < publish_end_at
  )
);

-- フォームテーブルのコメント
COMMENT ON TABLE public.forms IS 'フォームの基本情報を管理するテーブル';
COMMENT ON COLUMN public.forms.created_by IS 'フォーム作成者（profiles.id）';
COMMENT ON COLUMN public.forms.status IS 'フォームの状態（draft: 下書き, published: 公開中, closed: 終了）';
COMMENT ON COLUMN public.forms.publish_start_at IS '公開開始日時（NULLの場合は即時公開）';
COMMENT ON COLUMN public.forms.publish_end_at IS '公開終了日時（NULLの場合は無期限）';

-- ----------------------------------------------------------------------------
-- 2. イベントテーブル
-- ----------------------------------------------------------------------------

-- イベントマスタテーブル
CREATE TABLE public.events (
  id                 uuid        NOT NULL DEFAULT gen_random_uuid(),
  created_by         uuid        NOT NULL,
  title              varchar(200) NOT NULL,
  description        text,
  location           varchar(200),
  start_at           timestamptz NOT NULL,
  end_at             timestamptz NOT NULL,
  capacity           integer     NOT NULL,
  waitlist_capacity  integer     NOT NULL DEFAULT 0,
  status             varchar(20)  NOT NULL DEFAULT 'draft',
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),

  -- 制約定義
  CONSTRAINT pk_events PRIMARY KEY (id),
  CONSTRAINT fk_events_created_by
    FOREIGN KEY (created_by) REFERENCES public.profiles(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT ck_events_status CHECK (status IN ('draft', 'published', 'in_progress', 'completed', 'cancelled')),
  CONSTRAINT ck_events_title_not_empty CHECK (length(trim(title)) > 0),
  CONSTRAINT ck_events_dates CHECK (start_at < end_at),
  CONSTRAINT ck_events_capacity CHECK (capacity > 0),
  CONSTRAINT ck_events_waitlist_capacity CHECK (waitlist_capacity >= 0)
);

-- イベントテーブルのコメント
COMMENT ON TABLE public.events IS 'イベントの基本情報を管理するテーブル';
COMMENT ON COLUMN public.events.created_by IS 'イベント作成者（profiles.id）';
COMMENT ON COLUMN public.events.status IS 'イベントの状態（draft: 下書き, published: 公開中, in_progress: 開催中, completed: 終了, cancelled: 中止）';
COMMENT ON COLUMN public.events.capacity IS 'イベントの定員（正の整数）';
COMMENT ON COLUMN public.events.waitlist_capacity IS 'キャンセル待ちの定員（0以上）';

-- ----------------------------------------------------------------------------
-- 3. フォーム・イベント関連テーブル（多対多）
-- ----------------------------------------------------------------------------

-- フォーム・イベント関連テーブル
CREATE TABLE public.form_events (
  form_id     uuid        NOT NULL,
  event_id    uuid        NOT NULL,
  is_required boolean     NOT NULL DEFAULT false,
  priority    integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),

  -- 制約定義
  CONSTRAINT pk_form_events PRIMARY KEY (form_id, event_id),
  CONSTRAINT fk_form_events_form_id
    FOREIGN KEY (form_id) REFERENCES public.forms(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_form_events_event_id
    FOREIGN KEY (event_id) REFERENCES public.events(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT ck_form_events_priority CHECK (priority >= 0)
);

-- フォーム・イベント関連テーブルのコメント
COMMENT ON TABLE public.form_events IS 'フォームとイベントの多対多関連を管理するテーブル';
COMMENT ON COLUMN public.form_events.is_required IS 'イベント参加にこのフォームの提出が必須かどうか';
COMMENT ON COLUMN public.form_events.priority IS '表示順序（小さい値ほど優先）';

-- ----------------------------------------------------------------------------
-- 4. フォーム項目テーブル
-- ----------------------------------------------------------------------------

-- フォーム項目テーブル
CREATE TABLE public.form_fields (
  id               uuid        NOT NULL DEFAULT gen_random_uuid(),
  form_id          uuid        NOT NULL,
  field_type       varchar(20)  NOT NULL,
  label            varchar(200) NOT NULL,
  description      text,
  is_required      boolean     NOT NULL DEFAULT false,
  display_order    integer     NOT NULL DEFAULT 0,
  validation_rules jsonb,
  field_options    jsonb,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),

  -- 制約定義
  CONSTRAINT pk_form_fields PRIMARY KEY (id),
  CONSTRAINT fk_form_fields_form_id
    FOREIGN KEY (form_id) REFERENCES public.forms(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT ck_form_fields_type CHECK (field_type IN ('text', 'email', 'tel', 'select', 'checkbox', 'radio', 'textarea')),
  CONSTRAINT ck_form_fields_label_not_empty CHECK (length(trim(label)) > 0),
  CONSTRAINT ck_form_fields_display_order CHECK (display_order >= 0)
);

-- フォーム項目テーブルのコメント
COMMENT ON TABLE public.form_fields IS 'フォームの入力項目を管理するテーブル';
COMMENT ON COLUMN public.form_fields.field_type IS '項目タイプ（text: テキスト, email: メール, tel: 電話, select: 選択, checkbox: チェックボックス, radio: ラジオボタン, textarea: テキストエリア）';
COMMENT ON COLUMN public.form_fields.validation_rules IS 'バリデーションルール（JSON形式）';
COMMENT ON COLUMN public.form_fields.field_options IS 'フィールド固有のオプション（選択肢など、JSON形式）';

-- ----------------------------------------------------------------------------
-- 5. フォーム提出テーブル
-- ----------------------------------------------------------------------------

-- フォーム提出テーブル
CREATE TABLE public.form_submissions (
  id           uuid        NOT NULL DEFAULT gen_random_uuid(),
  form_id      uuid        NOT NULL,
  submitted_by uuid        NOT NULL,
  status       varchar(20)  NOT NULL DEFAULT 'draft',
  submitted_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),

  -- 制約定義
  CONSTRAINT pk_form_submissions PRIMARY KEY (id),
  CONSTRAINT fk_form_submissions_form_id
    FOREIGN KEY (form_id) REFERENCES public.forms(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_form_submissions_submitted_by
    FOREIGN KEY (submitted_by) REFERENCES public.profiles(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT ck_form_submissions_status CHECK (status IN ('draft', 'submitted', 'approved', 'rejected'))
);

-- フォーム提出テーブルのコメント
COMMENT ON TABLE public.form_submissions IS 'フォームの提出記録を管理するテーブル';
COMMENT ON COLUMN public.form_submissions.submitted_by IS '提出者（profiles.id）';
COMMENT ON COLUMN public.form_submissions.status IS '提出の状態（draft: 下書き, submitted: 提出済み, approved: 承認, rejected: 却下）';
COMMENT ON COLUMN public.form_submissions.submitted_at IS '正式提出日時（draftの場合はNULL）';

-- ----------------------------------------------------------------------------
-- 6. フォーム回答テーブル
-- ----------------------------------------------------------------------------

-- フォーム回答テーブル
CREATE TABLE public.form_submission_answers (
  id            uuid        NOT NULL DEFAULT gen_random_uuid(),
  submission_id uuid        NOT NULL,
  field_id      uuid        NOT NULL,
  answer_text   text,
  answer_data   jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  -- 制約定義
  CONSTRAINT pk_form_submission_answers PRIMARY KEY (id),
  CONSTRAINT fk_form_submission_answers_submission_id
    FOREIGN KEY (submission_id) REFERENCES public.form_submissions(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_form_submission_answers_field_id
    FOREIGN KEY (field_id) REFERENCES public.form_fields(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT uq_form_submission_answers_submission_field UNIQUE (submission_id, field_id)
);

-- フォーム回答テーブルのコメント
COMMENT ON TABLE public.form_submission_answers IS '各フォーム項目への回答を管理するテーブル';
COMMENT ON COLUMN public.form_submission_answers.answer_text IS 'テキスト形式の回答';
COMMENT ON COLUMN public.form_submission_answers.answer_data IS '構造化された回答データ（JSON形式）';

-- ----------------------------------------------------------------------------
-- 7. イベント参加テーブル
-- ----------------------------------------------------------------------------

-- イベント参加テーブル
CREATE TABLE public.event_participations (
  id                  uuid        NOT NULL DEFAULT gen_random_uuid(),
  event_id            uuid        NOT NULL,
  profile_id          uuid        NOT NULL,
  submission_id       uuid,
  status              varchar(20)  NOT NULL DEFAULT 'registered',
  cancellation_reason text,
  registered_at       timestamptz NOT NULL DEFAULT now(),
  cancelled_at        timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  -- 制約定義
  CONSTRAINT pk_event_participations PRIMARY KEY (id),
  CONSTRAINT fk_event_participations_event_id
    FOREIGN KEY (event_id) REFERENCES public.events(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_event_participations_profile_id
    FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_event_participations_submission_id
    FOREIGN KEY (submission_id) REFERENCES public.form_submissions(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT ck_event_participations_status CHECK (status IN ('registered', 'attended', 'cancelled', 'no_show')),
  CONSTRAINT uq_event_participations_event_profile UNIQUE (event_id, profile_id)
);

-- イベント参加テーブルのコメント
COMMENT ON TABLE public.event_participations IS 'イベントへの参加状況を管理するテーブル';
COMMENT ON COLUMN public.event_participations.submission_id IS '関連するフォーム提出（任意）';
COMMENT ON COLUMN public.event_participations.status IS '参加状態（registered: 登録済み, attended: 参加, cancelled: キャンセル, no_show: 欠席）';
COMMENT ON COLUMN public.event_participations.cancellation_reason IS 'キャンセル理由';

-- ----------------------------------------------------------------------------
-- 8. キャンセル待ちテーブル
-- ----------------------------------------------------------------------------

-- キャンセル待ちテーブル
CREATE TABLE public.waitlists (
  id          uuid        NOT NULL DEFAULT gen_random_uuid(),
  event_id    uuid        NOT NULL,
  profile_id  uuid        NOT NULL,
  position    integer     NOT NULL,
  status      varchar(20)  NOT NULL DEFAULT 'waiting',
  offered_at  timestamptz,
  expires_at  timestamptz,
  accepted_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  -- 制約定義
  CONSTRAINT pk_waitlists PRIMARY KEY (id),
  CONSTRAINT fk_waitlists_event_id
    FOREIGN KEY (event_id) REFERENCES public.events(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_waitlists_profile_id
    FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT ck_waitlists_status CHECK (status IN ('waiting', 'offered', 'accepted', 'declined', 'expired')),
  CONSTRAINT ck_waitlists_position CHECK (position > 0),
  CONSTRAINT uq_waitlists_event_position UNIQUE (event_id, position),
  CONSTRAINT uq_waitlists_event_profile UNIQUE (event_id, profile_id)
);

-- キャンセル待ちテーブルのコメント
COMMENT ON TABLE public.waitlists IS 'イベントのキャンセル待ちリストを管理するテーブル';
COMMENT ON COLUMN public.waitlists.position IS 'キャンセル待ちの順位（1から開始）';
COMMENT ON COLUMN public.waitlists.status IS 'キャンセル待ちの状態（waiting: 待機中, offered: 案内済み, accepted: 受諾, declined: 辞退, expired: 期限切れ）';
COMMENT ON COLUMN public.waitlists.offered_at IS '参加案内送信日時';
COMMENT ON COLUMN public.waitlists.expires_at IS '参加案内の有効期限';
COMMENT ON COLUMN public.waitlists.accepted_at IS '受諾日時';

-- ----------------------------------------------------------------------------
-- 9. インデックス定義
-- ----------------------------------------------------------------------------

-- フォームテーブル
CREATE INDEX idx_forms_created_by ON public.forms(created_by);
CREATE INDEX idx_forms_status ON public.forms(status) WHERE status = 'published';
CREATE INDEX idx_forms_publish_dates ON public.forms(publish_start_at, publish_end_at)
  WHERE publish_start_at IS NOT NULL;

-- イベントテーブル
CREATE INDEX idx_events_created_by ON public.events(created_by);
CREATE INDEX idx_events_status ON public.events(status) WHERE status IN ('published', 'in_progress');
CREATE INDEX idx_events_dates ON public.events(start_at, end_at);

-- フォーム項目テーブル
CREATE INDEX idx_form_fields_form_id ON public.form_fields(form_id);
CREATE INDEX idx_form_fields_display_order ON public.form_fields(form_id, display_order);

-- フォーム提出テーブル
CREATE INDEX idx_form_submissions_form_id ON public.form_submissions(form_id);
CREATE INDEX idx_form_submissions_submitted_by ON public.form_submissions(submitted_by);
CREATE INDEX idx_form_submissions_status ON public.form_submissions(status);

-- フォーム回答テーブル
CREATE INDEX idx_form_submission_answers_submission_id ON public.form_submission_answers(submission_id);
CREATE INDEX idx_form_submission_answers_field_id ON public.form_submission_answers(field_id);

-- イベント参加テーブル
CREATE INDEX idx_event_participations_event_id ON public.event_participations(event_id);
CREATE INDEX idx_event_participations_profile_id ON public.event_participations(profile_id);
CREATE INDEX idx_event_participations_status ON public.event_participations(event_id, status);

-- キャンセル待ちテーブル
CREATE INDEX idx_waitlists_event_id ON public.waitlists(event_id);
CREATE INDEX idx_waitlists_profile_id ON public.waitlists(profile_id);
CREATE INDEX idx_waitlists_status ON public.waitlists(event_id, status, position)
  WHERE status = 'waiting';

-- ----------------------------------------------------------------------------
-- 10. updated_atトリガー設定
-- ----------------------------------------------------------------------------

CREATE TRIGGER tr_forms_updated_at
  BEFORE UPDATE ON public.forms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER tr_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER tr_form_fields_updated_at
  BEFORE UPDATE ON public.form_fields
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER tr_form_submissions_updated_at
  BEFORE UPDATE ON public.form_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER tr_form_submission_answers_updated_at
  BEFORE UPDATE ON public.form_submission_answers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER tr_event_participations_updated_at
  BEFORE UPDATE ON public.event_participations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER tr_waitlists_updated_at
  BEFORE UPDATE ON public.waitlists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 11. Row Level Security (RLS) 設定
-- ----------------------------------------------------------------------------

-- RLS有効化
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submission_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlists ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- フォームテーブルのRLSポリシー
-- ============================================================================
CREATE POLICY "forms_select_policy" ON public.forms
  FOR SELECT USING (
    created_by = (SELECT id FROM public.profiles WHERE user_id = public.get_current_user_id())
    OR status = 'published'
    OR public.get_user_permission_level() >= 5
  );

CREATE POLICY "forms_insert_policy" ON public.forms
  FOR INSERT WITH CHECK (
    created_by = (SELECT id FROM public.profiles WHERE user_id = public.get_current_user_id())
  );

CREATE POLICY "forms_update_policy" ON public.forms
  FOR UPDATE USING (
    created_by = (SELECT id FROM public.profiles WHERE user_id = public.get_current_user_id())
    OR public.is_admin()
  );

CREATE POLICY "forms_delete_policy" ON public.forms
  FOR DELETE USING (public.is_admin());

-- ============================================================================
-- イベントテーブルのRLSポリシー
-- ============================================================================
CREATE POLICY "events_select_policy" ON public.events
  FOR SELECT USING (
    created_by = (SELECT id FROM public.profiles WHERE user_id = public.get_current_user_id())
    OR status IN ('published', 'in_progress')
    OR public.get_user_permission_level() >= 5
  );

CREATE POLICY "events_insert_policy" ON public.events
  FOR INSERT WITH CHECK (
    created_by = (SELECT id FROM public.profiles WHERE user_id = public.get_current_user_id())
  );

CREATE POLICY "events_update_policy" ON public.events
  FOR UPDATE USING (
    created_by = (SELECT id FROM public.profiles WHERE user_id = public.get_current_user_id())
    OR public.is_admin()
  );

CREATE POLICY "events_delete_policy" ON public.events
  FOR DELETE USING (public.is_admin());

-- ============================================================================
-- フォーム・イベント関連テーブルのRLSポリシー
-- ============================================================================
CREATE POLICY "form_events_select_policy" ON public.form_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.forms
      WHERE id = form_events.form_id
      AND (
        created_by = (SELECT id FROM public.profiles WHERE user_id = public.get_current_user_id())
        OR status = 'published'
        OR public.get_user_permission_level() >= 5
      )
    )
  );

CREATE POLICY "form_events_insert_policy" ON public.form_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.forms
      WHERE id = form_events.form_id
      AND created_by = (SELECT id FROM public.profiles WHERE user_id = public.get_current_user_id())
    )
    OR EXISTS (
      SELECT 1 FROM public.events
      WHERE id = form_events.event_id
      AND created_by = (SELECT id FROM public.profiles WHERE user_id = public.get_current_user_id())
    )
    OR public.is_admin()
  );

CREATE POLICY "form_events_update_policy" ON public.form_events
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.forms
      WHERE id = form_events.form_id
      AND created_by = (SELECT id FROM public.profiles WHERE user_id = public.get_current_user_id())
    )
    OR EXISTS (
      SELECT 1 FROM public.events
      WHERE id = form_events.event_id
      AND created_by = (SELECT id FROM public.profiles WHERE user_id = public.get_current_user_id())
    )
    OR public.is_admin()
  );

CREATE POLICY "form_events_delete_policy" ON public.form_events
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.forms
      WHERE id = form_events.form_id
      AND created_by = (SELECT id FROM public.profiles WHERE user_id = public.get_current_user_id())
    )
    OR EXISTS (
      SELECT 1 FROM public.events
      WHERE id = form_events.event_id
      AND created_by = (SELECT id FROM public.profiles WHERE user_id = public.get_current_user_id())
    )
    OR public.is_admin()
  );

-- Form fields RLS policies
CREATE POLICY "form_fields_select_policy" ON public.form_fields
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.forms
      WHERE id = form_fields.form_id
      AND (
        created_by = (SELECT id FROM public.profiles WHERE user_id = public.get_current_user_id())
        OR status = 'published'
        OR public.get_user_permission_level() >= 5
      )
    )
  );

CREATE POLICY "form_fields_insert_policy" ON public.form_fields
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.forms
      WHERE id = form_fields.form_id
      AND created_by = (SELECT id FROM public.profiles WHERE user_id = public.get_current_user_id())
    )
    OR public.is_admin()
  );

CREATE POLICY "form_fields_update_policy" ON public.form_fields
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.forms
      WHERE id = form_fields.form_id
      AND created_by = (SELECT id FROM public.profiles WHERE user_id = public.get_current_user_id())
    )
    OR public.is_admin()
  );

CREATE POLICY "form_fields_delete_policy" ON public.form_fields
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.forms
      WHERE id = form_fields.form_id
      AND created_by = (SELECT id FROM public.profiles WHERE user_id = public.get_current_user_id())
    )
    OR public.is_admin()
  );

-- Form submissions RLS policies
CREATE POLICY "form_submissions_select_policy" ON public.form_submissions
  FOR SELECT USING (
    submitted_by = (SELECT id FROM public.profiles WHERE user_id = public.get_current_user_id())
    OR EXISTS (
      SELECT 1 FROM public.forms
      WHERE id = form_submissions.form_id
      AND created_by = (SELECT id FROM public.profiles WHERE user_id = public.get_current_user_id())
    )
    OR public.get_user_permission_level() >= 5
  );

CREATE POLICY "form_submissions_insert_policy" ON public.form_submissions
  FOR INSERT WITH CHECK (
    submitted_by = (SELECT id FROM public.profiles WHERE user_id = public.get_current_user_id())
    AND EXISTS (
      SELECT 1 FROM public.forms
      WHERE id = form_submissions.form_id
      AND status = 'published'
    )
  );

CREATE POLICY "form_submissions_update_policy" ON public.form_submissions
  FOR UPDATE USING (
    (
      submitted_by = (SELECT id FROM public.profiles WHERE user_id = public.get_current_user_id())
      AND status = 'draft'
    )
    OR EXISTS (
      SELECT 1 FROM public.forms
      WHERE id = form_submissions.form_id
      AND created_by = (SELECT id FROM public.profiles WHERE user_id = public.get_current_user_id())
    )
    OR public.is_admin()
  );

CREATE POLICY "form_submissions_delete_policy" ON public.form_submissions
  FOR DELETE USING (public.is_admin());

-- Form submission answers RLS policies
CREATE POLICY "form_submission_answers_select_policy" ON public.form_submission_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.form_submissions
      WHERE id = form_submission_answers.submission_id
      AND (
        submitted_by = (SELECT id FROM public.profiles WHERE user_id = public.get_current_user_id())
        OR EXISTS (
          SELECT 1 FROM public.forms
          WHERE id = form_submissions.form_id
          AND created_by = (SELECT id FROM public.profiles WHERE user_id = public.get_current_user_id())
        )
        OR public.get_user_permission_level() >= 5
      )
    )
  );

CREATE POLICY "form_submission_answers_insert_policy" ON public.form_submission_answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.form_submissions
      WHERE id = form_submission_answers.submission_id
      AND submitted_by = (SELECT id FROM public.profiles WHERE user_id = public.get_current_user_id())
      AND status = 'draft'
    )
    OR public.is_admin()
  );

CREATE POLICY "form_submission_answers_update_policy" ON public.form_submission_answers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.form_submissions
      WHERE id = form_submission_answers.submission_id
      AND submitted_by = (SELECT id FROM public.profiles WHERE user_id = public.get_current_user_id())
      AND status = 'draft'
    )
    OR public.is_admin()
  );

CREATE POLICY "form_submission_answers_delete_policy" ON public.form_submission_answers
  FOR DELETE USING (public.is_admin());

-- Event participations RLS policies
CREATE POLICY "event_participations_select_policy" ON public.event_participations
  FOR SELECT USING (
    profile_id = (SELECT id FROM public.profiles WHERE user_id = public.get_current_user_id())
    OR EXISTS (
      SELECT 1 FROM public.events
      WHERE id = event_participations.event_id
      AND created_by = (SELECT id FROM public.profiles WHERE user_id = public.get_current_user_id())
    )
    OR public.get_user_permission_level() >= 5
  );

CREATE POLICY "event_participations_insert_policy" ON public.event_participations
  FOR INSERT WITH CHECK (
    profile_id = (SELECT id FROM public.profiles WHERE user_id = public.get_current_user_id())
    AND EXISTS (
      SELECT 1 FROM public.events
      WHERE id = event_participations.event_id
      AND status IN ('published', 'in_progress')
    )
  );

CREATE POLICY "event_participations_update_policy" ON public.event_participations
  FOR UPDATE USING (
    profile_id = (SELECT id FROM public.profiles WHERE user_id = public.get_current_user_id())
    OR EXISTS (
      SELECT 1 FROM public.events
      WHERE id = event_participations.event_id
      AND created_by = (SELECT id FROM public.profiles WHERE user_id = public.get_current_user_id())
    )
    OR public.is_admin()
  );

CREATE POLICY "event_participations_delete_policy" ON public.event_participations
  FOR DELETE USING (public.is_admin());

-- Waitlists RLS policies
CREATE POLICY "waitlists_select_policy" ON public.waitlists
  FOR SELECT USING (
    profile_id = (SELECT id FROM public.profiles WHERE user_id = public.get_current_user_id())
    OR EXISTS (
      SELECT 1 FROM public.events
      WHERE id = waitlists.event_id
      AND created_by = (SELECT id FROM public.profiles WHERE user_id = public.get_current_user_id())
    )
    OR public.get_user_permission_level() >= 5
  );

CREATE POLICY "waitlists_insert_policy" ON public.waitlists
  FOR INSERT WITH CHECK (
    profile_id = (SELECT id FROM public.profiles WHERE user_id = public.get_current_user_id())
    AND EXISTS (
      SELECT 1 FROM public.events
      WHERE id = waitlists.event_id
      AND status IN ('published', 'in_progress')
    )
  );

CREATE POLICY "waitlists_update_policy" ON public.waitlists
  FOR UPDATE USING (
    profile_id = (SELECT id FROM public.profiles WHERE user_id = public.get_current_user_id())
    OR EXISTS (
      SELECT 1 FROM public.events
      WHERE id = waitlists.event_id
      AND created_by = (SELECT id FROM public.profiles WHERE user_id = public.get_current_user_id())
    )
    OR public.is_admin()
  );

CREATE POLICY "waitlists_delete_policy" ON public.waitlists
  FOR DELETE USING (public.is_admin());
