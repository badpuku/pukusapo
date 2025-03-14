-- Custom SQL migration file, put your code below! --

-- profiles テーブル作成
CREATE TABLE "profiles" (
  "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "user_id" UUID,
  "name" VARCHAR(100),
  "email" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
);

-- profiles テーブルの RLS の有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- authenticated ユーザーのみ、ユーザーの一覧取得を可能とするポリシー
CREATE POLICY "Allow select for all authenticated users."
  ON profiles FOR SELECT
  USING (
    auth.role() = 'authenticated'
  );

-- ユーザ自身が登録情報を変更する際に、操作者と変更対象データの ID が一致している確認するポリシー
CREATE POLICY "Allow update for users themselves."
  ON profiles FOR UPDATE
  USING (
    auth.uid() = user_id
  );

-- auth.users をコピーする関数の定義
-- TODO: email ログインを不可にする時に、email の insert を削除する
CREATE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

-- 作成した関数を実行するトリガーを作成
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
