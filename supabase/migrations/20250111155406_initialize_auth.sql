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

-- auth.users にデータがinsertされた時に、public.user にデータを追加するトリガー
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- public スキーマにeventsテーブルを作成する
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
create table public.events (
  id uuid primary key DEFAULT uuid_generate_v4(),
  "description" TEXT,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  max_participants INT,
  "location" VARCHAR(100),
  created_by uuid references public.users,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "status" VARCHAR(20) NOT NULL -- 'draft','published','private'
);

-- events テーブルへのRLSの設定
alter table public.events
  enable row level security;

-- ロールがauthenticatedのユーザのみ、データの一覧取得ができるポリシー
create policy "Allow select for all authenticated users."
  on public.events for select using (
    auth.role() = 'authenticated'
  );

-- ロールがauthenticatedのユーザのみ、データを更新できるポリシー
create policy "Allow update for all authenticated users."
  on public.events for update using (
    auth.role() = 'authenticated'
  );

-- updated_atを更新する関数を定義
create or replace function public.update_timestamp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = CURRENT_TIMESTAMP;
  return new;
end;
$$;

-- 作成した関数を実行するトリガーを作成
create trigger set_updated_at
  before update on public.events
  for each row execute function public.update_timestamp();