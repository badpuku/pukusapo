-- Custom SQL migration file, put your code below! --

-- profiles テーブル作成
create table "profiles" (
  "id" uuid default gen_random_uuid() primary key,
  "user_id" text not null default auth.jwt() ->>'sub',
  "name" varchar(100),
  "email" text,
  "created_at" timestamp default now(),
  "updated_at" timestamp default now()
);

-- profiles テーブルの RLS の有効化
alter table "profiles" enable row level security;


create policy "User can view their own profiles"
on "public"."profiles"
for select
to authenticated
using (
((select auth.jwt()->>'sub') = (user_id)::text)
);

create policy "Users must insert their own profiles"
on "public"."profiles"
as permissive
for insert
to authenticated
with check (
((select auth.jwt()->>'sub') = (user_id)::text)
);