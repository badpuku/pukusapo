-- public スキーマにusersテーブルを作成する
create table public.users (
  id uuid primary key references auth.users on delete cascade,
  email text not NULL,
  role varchar(50) default 'user',
  first_name text,
  last_name text,
  created_by uuid references public.users(id),
  created_at timestamp with time zone default now(),
  updated_by uuid references public.users(id),
  updated_at timestamp with time zone default now()
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

-- public スキーマにeventsテーブルを作成する
-- TODO:: トリガー等は後から追加する
create table public.events (
  id uuid primary key default gen_random_uuid(),
  title varchar(50) not NULL,
  description text,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  max_participants integer,
  created_by uuid references public.users(id),
  created_at timestamp with time zone default now(),
  updated_by uuid references public.users(id),
  updated_at timestamp with time zone default now(),
  status varchar(20) -- 'draft', 'published', 'closed'
);

-- public スキーマにイベント登録者情報テーブルを作成する
create table public.event_registrations (
  user_id uuid references public.users(id),
  event_id uuid references public.events(id),
  registered_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  created_by uuid references public.users(id),
  updated_at timestamp with time zone default now(),
  updated_by uuid references public.users(id),
  status integer, -- 'registered', 'cancelled' TODO:: ここだけ数字での管理でいいのか
  primary key (event_id, user_id)
);