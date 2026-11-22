-- Salary — schema for Supabase (run once in: Dashboard → SQL Editor → New query → Run)
--
-- Design: one row per "slice" of the app state (incomes, fixed, variable, ...),
-- stored as JSONB. This mirrors exactly how the frontend already keeps its data,
-- so the React code barely changes. Each user only sees their own rows (RLS).

create table if not exists public.user_data (
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  key        text        not null,
  value      jsonb       not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

-- Keep updated_at fresh on every update
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_data_touch on public.user_data;
create trigger user_data_touch
  before update on public.user_data
  for each row execute function public.touch_updated_at();

-- Row Level Security: without it, ANYONE with the public (anon) key could read the table.
alter table public.user_data enable row level security;

drop policy if exists "own rows: select" on public.user_data;
drop policy if exists "own rows: insert" on public.user_data;
drop policy if exists "own rows: update" on public.user_data;
drop policy if exists "own rows: delete" on public.user_data;

create policy "own rows: select" on public.user_data
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "own rows: insert" on public.user_data
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own rows: update" on public.user_data
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own rows: delete" on public.user_data
  for delete to authenticated using ((select auth.uid()) = user_id);
