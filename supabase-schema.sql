create table if not exists public.app_state (
  key text primary key,
  value jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

drop policy if exists "Read app state" on public.app_state;
create policy "Read app state"
  on public.app_state for select
  to anon, authenticated
  using (true);

drop policy if exists "Write app state" on public.app_state;
create policy "Write app state"
  on public.app_state for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Update app state" on public.app_state;
create policy "Update app state"
  on public.app_state for update
  to anon, authenticated
  using (true)
  with check (true);

create table if not exists public.cleaner_accounts (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  cleaner_name text not null unique,
  created_at timestamptz not null default now()
);

alter table public.cleaner_accounts enable row level security;

drop policy if exists "Read cleaner accounts" on public.cleaner_accounts;
create policy "Read cleaner accounts"
  on public.cleaner_accounts for select
  to anon, authenticated
  using (true);

drop policy if exists "Cleaner owns account row" on public.cleaner_accounts;
create policy "Cleaner owns account row"
  on public.cleaner_accounts for all
  to authenticated
  using (auth.uid() = auth_user_id)
  with check (auth.uid() = auth_user_id);
