-- public スキーマにusersテーブルを作成する
create table public.users (
  id uuid primary key references auth.users on delete cascade,
  email text not NULL,
  first_name text,
  last_name text
);

-- users テーブルへのRLSの設定
alter table public.users
  enable row level security;

-- ロールがauthenticatedのユーザのみ、ユーザの一覧取得を可能とするポリシー
create policy "Allow select for all authenticated users."
  on public.users for select using (
    auth.role() = 'authenticated'
  );

-- ユーザ自身が登録情報を変更する際に、操作者と変更対象データのIDが一致している確認するポリシー
create policy "Allow update for users themselves."
  on public.users for update using (
    auth.uid() = id
  );


-- auth.users をコピーする関数の定義
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

-- 作成した関数を実行するトリガーを作成
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();