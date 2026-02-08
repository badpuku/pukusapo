-- ----------------------------------------------------------------------------
-- 管理者プロファイルの初期作成
-- ----------------------------------------------------------------------------
-- デプロイ前に 'REPLACE_WITH_CLERK_USER_ID' を実際の Clerk user ID に変更してください
-- 例: 'user_2abc123def456'
-- ----------------------------------------------------------------------------

INSERT INTO public.profiles (user_id, role_id, username, full_name, is_active)
VALUES (
  'REPLACE_WITH_CLERK_USER_ID',
  (SELECT id FROM public.roles WHERE code = 'admin'),
  'admin',
  'SUPABASE_管理者',
  true
)
ON CONFLICT (user_id) DO UPDATE SET
  role_id = (SELECT id FROM public.roles WHERE code = 'admin'),
  updated_at = now();
