-- Custom SQL migration file, put your code below! --

-- profiles テーブル作成
create table public.profiles (
  "id" uuid default gen_random_uuid() primary key,
  "user_id" text not null unique,
  "name" varchar(100),
  "created_at" timestamp default now(),
  "updated_at" timestamp default now()
);

-- profiles テーブルの RLS の有効化
alter table public.profiles enable row level security;

-- 自分のプロフィールを表示できるポリシー
create policy "Users can view their own profile"
on public.profiles
for select
using (auth.uid()::text = user_id);

-- 自分のプロフィールを挿入できるポリシー
create policy "Users can insert their own profile"
on public.profiles
for insert
with check (auth.uid()::text = user_id);

-- 自分のプロフィールを更新できるポリシー
create policy "Users can update their own profile"
on public.profiles
for update
using (auth.uid()::text = user_id)
with check (auth.uid()::text = user_id);

-- 自分のプロフィールを削除できるポリシー
create policy "Users can delete their own profile"
on public.profiles
for delete
using (auth.uid()::text = user_id);

-- updated_at を自動更新するトリガー関数
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- updated_at 自動更新トリガー
create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();
