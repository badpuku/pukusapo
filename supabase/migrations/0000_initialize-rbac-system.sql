-- ============================================================================
-- データベース初期化マイグレーション（t-wada設計原則適用版）
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ロール管理テーブル（権限の基盤）
-- ----------------------------------------------------------------------------

-- ロールマスタテーブル
CREATE TABLE public.roles (
  id                bigserial     NOT NULL,
  code              varchar(50)   NOT NULL,
  name              varchar(100)  NOT NULL,
  description       text,
  permission_level  integer       NOT NULL DEFAULT 0,
  is_active         boolean       NOT NULL DEFAULT true,
  created_at        timestamptz   NOT NULL DEFAULT now(),
  updated_at        timestamptz   NOT NULL DEFAULT now(),
  
  -- 制約定義
  CONSTRAINT pk_roles PRIMARY KEY (id),
  CONSTRAINT uq_roles_code UNIQUE (code),
  CONSTRAINT ck_roles_code_format CHECK (code ~ '^[a-z][a-z0-9_]*$'),
  CONSTRAINT ck_roles_name_not_empty CHECK (length(trim(name)) > 0),
  CONSTRAINT ck_roles_permission_level_range CHECK (permission_level >= 0 AND permission_level <= 100)
);

-- ロールテーブルのコメント
COMMENT ON TABLE public.roles IS 'システム内で利用可能なユーザーロールを定義するマスタテーブル';
COMMENT ON COLUMN public.roles.code IS 'ロールを識別する一意なコード（小文字英数字とアンダースコアのみ）';
COMMENT ON COLUMN public.roles.name IS 'ユーザーに表示されるロール名';
COMMENT ON COLUMN public.roles.permission_level IS '権限レベル（0-100、数値が高いほど強い権限）';

-- ----------------------------------------------------------------------------
-- 2. 権限管理テーブル（細かい権限制御）
-- ----------------------------------------------------------------------------

-- 権限マスタテーブル
CREATE TABLE public.permissions (
  id          bigserial     NOT NULL,
  code        varchar(100)  NOT NULL,
  name        varchar(200)  NOT NULL,
  resource    varchar(50)   NOT NULL,
  action      varchar(50)   NOT NULL,
  description text,
  is_active   boolean       NOT NULL DEFAULT true,
  created_at  timestamptz   NOT NULL DEFAULT now(),
  updated_at  timestamptz   NOT NULL DEFAULT now(),
  
  -- 制約定義
  CONSTRAINT pk_permissions PRIMARY KEY (id),
  CONSTRAINT uq_permissions_code UNIQUE (code),
  CONSTRAINT uq_permissions_resource_action UNIQUE (resource, action),
  CONSTRAINT ck_permissions_code_format CHECK (code ~ '^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$'),
  CONSTRAINT ck_permissions_resource_format CHECK (resource ~ '^[a-z][a-z0-9_]*$'),
  CONSTRAINT ck_permissions_action_format CHECK (action ~ '^[a-z][a-z0-9_]*$'),
  CONSTRAINT ck_permissions_name_not_empty CHECK (length(trim(name)) > 0)
);

-- 権限テーブルのコメント
COMMENT ON TABLE public.permissions IS 'システム内で利用可能な権限を定義するマスタテーブル';
COMMENT ON COLUMN public.permissions.code IS '権限を識別する一意なコード（resource.action形式）';
COMMENT ON COLUMN public.permissions.resource IS 'アクセス対象のリソース名';
COMMENT ON COLUMN public.permissions.action IS 'リソースに対するアクション名';

-- ----------------------------------------------------------------------------
-- 3. ロール・権限関連テーブル（多対多関係）
-- ----------------------------------------------------------------------------

-- ロール権限関連テーブル
CREATE TABLE public.role_permissions (
  role_id       bigint      NOT NULL,
  permission_id bigint      NOT NULL,
  granted_at    timestamptz NOT NULL DEFAULT now(),
  granted_by    text,
  
  -- 制約定義
  CONSTRAINT pk_role_permissions PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_role_permissions_role_id 
    FOREIGN KEY (role_id) REFERENCES public.roles(id) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_role_permissions_permission_id 
    FOREIGN KEY (permission_id) REFERENCES public.permissions(id) 
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- ロール権限関連テーブルのコメント
COMMENT ON TABLE public.role_permissions IS 'ロールと権限の関連を管理するテーブル';
COMMENT ON COLUMN public.role_permissions.granted_by IS '権限を付与したユーザーのID';

-- ----------------------------------------------------------------------------
-- 4. ユーザープロファイルテーブル（最終）
-- ----------------------------------------------------------------------------

-- プロファイルテーブル
CREATE TABLE public.profiles (
  id         uuid        NOT NULL DEFAULT gen_random_uuid(),
  user_id    text        NOT NULL,
  role_id    bigint      NOT NULL,
  username   text,
  full_name  text,
  avatar_url text,
  is_active  boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- 制約定義
  CONSTRAINT pk_profiles PRIMARY KEY (id),
  CONSTRAINT uq_profiles_user_id UNIQUE (user_id),
  CONSTRAINT uq_profiles_username UNIQUE (username),
  CONSTRAINT fk_profiles_role_id 
    FOREIGN KEY (role_id) REFERENCES public.roles(id) 
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT ck_profiles_user_id_not_empty CHECK (length(trim(user_id)) > 0),
  CONSTRAINT ck_profiles_username_format CHECK (username IS NULL OR username ~ '^[a-zA-Z0-9_-]{3,30}$'),
  CONSTRAINT ck_profiles_avatar_url_format CHECK (avatar_url IS NULL OR avatar_url ~ '^https?://')
);

-- プロファイルテーブルのコメント
COMMENT ON TABLE public.profiles IS 'ユーザーのプロファイル情報とロール割り当てを管理するテーブル';
COMMENT ON COLUMN public.profiles.user_id IS 'Clerk認証システムのユーザーID';
COMMENT ON COLUMN public.profiles.role_id IS '割り当てられたロールのID';
COMMENT ON COLUMN public.profiles.username IS 'ユーザー名（英数字、ハイフン、アンダースコアのみ、3文字以上30文字以下）';



-- ----------------------------------------------------------------------------
-- 5. インデックス定義（パフォーマンス最適化）
-- ----------------------------------------------------------------------------

-- ロールテーブル用インデックス
CREATE INDEX idx_roles_code_active ON public.roles(code) WHERE is_active = true;
CREATE INDEX idx_roles_permission_level ON public.roles(permission_level DESC) WHERE is_active = true;

-- 権限テーブル用インデックス
CREATE INDEX idx_permissions_resource_action ON public.permissions(resource, action) WHERE is_active = true;
CREATE INDEX idx_permissions_code_active ON public.permissions(code) WHERE is_active = true;

-- プロファイルテーブル用インデックス
CREATE INDEX idx_profiles_role_id ON public.profiles(role_id) WHERE is_active = true;
CREATE INDEX idx_profiles_username ON public.profiles(username) WHERE username IS NOT NULL AND is_active = true;



-- ----------------------------------------------------------------------------
-- 6. トリガー関数定義（自動更新機能）
-- ----------------------------------------------------------------------------

-- updated_at自動更新関数
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 各テーブルにupdated_atトリガーを設定
CREATE TRIGGER tr_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER tr_permissions_updated_at
  BEFORE UPDATE ON public.permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER tr_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();



-- ----------------------------------------------------------------------------
-- 7. Row Level Security (RLS) 設定
-- ----------------------------------------------------------------------------

-- RLS有効化
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- RLSポリシー定義
-- ロールテーブル：全員閲覧可能、管理者のみ編集可能
CREATE POLICY "roles_select_policy" ON public.roles
  FOR SELECT USING (is_active = true);

CREATE POLICY "roles_insert_policy" ON public.roles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.roles r ON p.role_id = r.id
      WHERE p.user_id = auth.uid()::text 
      AND r.code = 'admin'
      AND p.is_active = true
      AND r.is_active = true
    )
  );

CREATE POLICY "roles_update_policy" ON public.roles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.roles r ON p.role_id = r.id
      WHERE p.user_id = auth.uid()::text 
      AND r.code = 'admin'
      AND p.is_active = true
      AND r.is_active = true
    )
  );

-- 権限テーブル：全員閲覧可能、管理者のみ編集可能
CREATE POLICY "permissions_select_policy" ON public.permissions
  FOR SELECT USING (is_active = true);

CREATE POLICY "permissions_modify_policy" ON public.permissions
  FOR ALL WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.roles r ON p.role_id = r.id
      WHERE p.user_id = auth.uid()::text 
      AND r.code = 'admin'
      AND p.is_active = true
      AND r.is_active = true
    )
  );

-- プロファイルテーブル：自分のプロファイルまたは管理者権限
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT USING (
    user_id = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.roles r ON p.role_id = r.id
      WHERE p.user_id = auth.uid()::text 
      AND r.permission_level >= 10
      AND p.is_active = true
      AND r.is_active = true
    )
  );

CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE USING (
    user_id = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.roles r ON p.role_id = r.id
      WHERE p.user_id = auth.uid()::text 
      AND r.permission_level >= 10
      AND p.is_active = true
      AND r.is_active = true
    )
  );

-- ロール権限関連テーブル：管理者のみアクセス可能
CREATE POLICY "role_permissions_policy" ON public.role_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.roles r ON p.role_id = r.id
      WHERE p.user_id = auth.uid()::text 
      AND r.code = 'admin'
      AND p.is_active = true
      AND r.is_active = true
    )
  );

-- ----------------------------------------------------------------------------
-- 8. マスタデータ初期投入
-- ----------------------------------------------------------------------------

-- ロールマスタデータ
INSERT INTO public.roles (code, name, description, permission_level) VALUES
('user', '一般ユーザー', '基本的な機能を利用できる標準ユーザー', 1),
('moderator', 'モデレーター', '一部の管理機能を利用できる中間管理者', 5),
('admin', '管理者', 'すべての管理機能を利用できるシステム管理者', 10);

-- 権限マスタデータ
INSERT INTO public.permissions (code, name, resource, action, description) VALUES
-- プロファイル関連権限
('profile.read', 'プロファイル閲覧', 'profile', 'read', '自分のプロファイル情報を閲覧する'),
('profile.update', 'プロファイル更新', 'profile', 'update', '自分のプロファイル情報を更新する'),

-- ユーザー管理権限
('users.read', 'ユーザー一覧閲覧', 'users', 'read', 'システム内のユーザー一覧を閲覧する'),
('users.create', 'ユーザー作成', 'users', 'create', '新しいユーザーを作成する'),
('users.update', 'ユーザー更新', 'users', 'update', 'ユーザー情報を更新する'),
('users.delete', 'ユーザー削除', 'users', 'delete', 'ユーザーを削除する'),

-- ロール・権限管理
('roles.read', 'ロール一覧閲覧', 'roles', 'read', 'システム内のロール一覧を閲覧する'),
('roles.create', 'ロール作成', 'roles', 'create', '新しいロールを作成する'),
('roles.update', 'ロール更新', 'roles', 'update', 'ロール情報を更新する'),
('roles.delete', 'ロール削除', 'roles', 'delete', 'ロールを削除する'),
('permissions.read', '権限一覧閲覧', 'permissions', 'read', 'システム内の権限一覧を閲覧する'),
('permissions.manage', '権限管理', 'permissions', 'manage', 'ロールに権限を割り当て・削除する'),

-- コンテンツ管理権限
('content.read', 'コンテンツ閲覧', 'content', 'read', 'コンテンツを閲覧する'),
('content.create', 'コンテンツ作成', 'content', 'create', '新しいコンテンツを作成する'),
('content.update', 'コンテンツ更新', 'content', 'update', 'コンテンツを更新する'),
('content.delete', 'コンテンツ削除', 'content', 'delete', 'コンテンツを削除する'),
('content.moderate', 'コンテンツモデレーション', 'content', 'moderate', 'コンテンツの承認・拒否を行う'),

-- システム管理権限
('system.settings', 'システム設定', 'system', 'settings', 'システムの設定を変更する'),
('system.monitoring', 'システム監視', 'system', 'monitoring', 'システムの監視情報を閲覧する'),
('system.backup', 'システムバックアップ', 'system', 'backup', 'システムのバックアップを実行する');

-- ロール権限関連データ
INSERT INTO public.role_permissions (role_id, permission_id) VALUES
-- user権限
(1, 1), (1, 2), (1, 13), -- profile.read, profile.update, content.read

-- moderator権限（user権限 + モデレーション権限）
(2, 1), (2, 2), (2, 13), (2, 14), (2, 15), (2, 16), (2, 17), (2, 3), -- user権限 + content管理 + users.read

-- admin権限（全権限）
(3, 1), (3, 2), (3, 3), (3, 4), (3, 5), (3, 6),  -- profile + users
(3, 7), (3, 8), (3, 9), (3, 10), (3, 11), (3, 12), -- roles + permissions
(3, 13), (3, 14), (3, 15), (3, 16), (3, 17),       -- content
(3, 18), (3, 19), (3, 20);                         -- system

-- ----------------------------------------------------------------------------
-- 9. ビュー定義（便利な参照用）
-- ----------------------------------------------------------------------------

-- ユーザー権限一覧ビュー
CREATE VIEW public.v_user_permissions AS
SELECT 
  p.user_id,
  p.username,
  r.code as role_code,
  r.name as role_name,
  r.permission_level,
  perm.code as permission_code,
  perm.name as permission_name,
  perm.resource,
  perm.action
FROM public.profiles p
JOIN public.roles r ON p.role_id = r.id
JOIN public.role_permissions rp ON r.id = rp.role_id
JOIN public.permissions perm ON rp.permission_id = perm.id
WHERE p.is_active = true 
  AND r.is_active = true 
  AND perm.is_active = true;

-- ビューのコメント
COMMENT ON VIEW public.v_user_permissions IS 'ユーザーが持つ全権限を一覧表示するビュー';

-- ============================================================================
-- マイグレーション完了
-- ============================================================================ 