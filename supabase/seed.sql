-- users 初期データ作成
WITH credentials(id, mail, pass) AS (
  -- ユーザーのUUID、メールアドレス、パスワードをここに記載
  SELECT * FROM (VALUES 
    ('11523b9c-eb9e-7af8-a666-9943fb389a20', 'example@example.com', 'password')
  ) AS users(id, mail, pass)
),
create_user AS (
  INSERT INTO auth.users (id, instance_id, ROLE, aud, email, raw_app_meta_data, raw_user_meta_data, is_super_admin, encrypted_password, created_at, updated_at, last_sign_in_at, email_confirmed_at, confirmation_sent_at, confirmation_token, recovery_token, email_change_token_new, email_change)
    SELECT id::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', mail, '{"provider":"email","providers":["email"]}', '{}', FALSE, crypt(pass, gen_salt('bf')), NOW(), NOW(), NOW(), NOW(), NOW(), '', '', '', '' FROM credentials
  RETURNING id
)
INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  SELECT gen_random_uuid(), id, id, json_build_object('sub', id), 'email', NOW(), NOW(), NOW() FROM create_user;

-- events 初期データ作成
INSERT INTO public.events (
    "description",
    start_date,
    end_date,
    max_participants,
    "location",
    created_by,
    "status"
) VALUES
('イベント1の説明', '2025-02-10 10:00:00', '2025-02-10 12:00:00', 50, '会場A', '11523b9c-eb9e-7af8-a666-9943fb389a20', 'draft'),
('イベント2の説明', '2025-02-15 14:00:00', '2025-02-15 16:00:00', 100, '会場B', '11523b9c-eb9e-7af8-a666-9943fb389a20', 'published'),
('イベント3の説明', '2025-02-20 18:00:00', '2025-02-20 20:00:00', 30, '会場C', '11523b9c-eb9e-7af8-a666-9943fb389a20', 'private'),
('イベント4の説明', '2025-02-25 19:00:00', '2025-02-25 21:00:00', NULL, NULL, '11523b9c-eb9e-7af8-a666-9943fb389a20', 'draft');