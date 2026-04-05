-- Collections table for Mythwright
-- Run this migration when Supabase connection is restored.

create table if not exists public.collections (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references auth.users not null,
  name         text not null,
  icon         text not null default '📂',
  filter       jsonb not null default '{}',
  position     integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.collections enable row level security;

create policy "collections_own" on public.collections
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create index if not exists collections_user_id_idx
  on public.collections using btree (user_id);
