-- Supabase schema for Anatomn.
-- Run the whole file in the Supabase Dashboard → SQL Editor (New query → Run).
-- Safe to run on the project at https://wckcbyobgpjwiolsdjjd.supabase.co.

-- ============================================================
-- 1. Profiles — one row per auth user, holding the display name.
--    Kept in sync automatically by triggers on auth.users.
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  email text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Own profile update. Reads go through "profiles_select_access" below.
-- Rows are created by the handle_new_user trigger.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid () = id) with check (auth.uid () = id);

-- Public landing page stats only need counts; nothing here is public.

-- ============================================================
-- 2. Admin — a profile flag, not a separate login. The first admin
--    is promoted manually with SQL (see the README):
--      update public.profiles set is_admin = true
--        where email = 'you@example.com';
--    `is_admin()` is a SECURITY DEFINER helper so policies inside
--    RLS can use it without recursion on profiles.
-- ============================================================
alter table public.profiles add column if not exists is_admin boolean not null default false;

create or replace function public.is_admin ()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid ()), false);
$$;

-- Nobody can grant themselves admin at request level: the column guard
-- refuses is_admin changes *from client sessions with a JWT* unless the
-- caller is already an admin. The SQL Editor / postgres role has no JWT,
-- so the dashboard can always promote the first admin.
create or replace function public.guard_profile_admin ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.is_admin is distinct from old.is_admin)
     and coalesce(current_setting('request.jwt.claims', true), '') <> ''
     and not public.is_admin () then
    raise exception 'Only admins can change is_admin.';
  end if;
  return new;
end;
$$;

drop trigger if exists on_profile_admin_guard on public.profiles;
create trigger on_profile_admin_guard
  before update on public.profiles
  for each row execute function public.guard_profile_admin ();

-- Admins see every profile; regular users keep seeing only their own.
drop policy if exists "profiles_select_access" on public.profiles;
create policy "profiles_select_access" on public.profiles
  for select using (auth.uid () = id or public.is_admin ());

-- ============================================================
-- 3. Payments — order-based (QPay / SocialPay / bank transfer).
--    The user creates a pending payment from the account page,
--    transfers the money, saves the bank reference here, and an
--    admin (or later, a payment webhook) confirms it. Confirming a
--    payment extends the user's subscription via a trigger.
-- ============================================================
create table if not exists public.payments (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  plan text not null check (plan in ('monthly', 'yearly')),
  amount_mnt int not null default 0,
  method text not null default 'qpay' check (method in ('qpay', 'socialpay', 'bank')),
  status text not null default 'pending' check (status in ('pending', 'completed', 'rejected')),
  -- bank/deposit slip reference typed by the user, checked by the admin
  reference text not null default '',
  admin_note text not null default '',
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  confirmed_by uuid references auth.users (id) on delete set null
);

alter table public.payments enable row level security;

drop policy if exists "payments_select_access" on public.payments;
create policy "payments_select_access" on public.payments
  for select using (auth.uid () = user_id or public.is_admin ());

-- A user may open a pending payment of their own.
drop policy if exists "payments_insert_own" on public.payments;
create policy "payments_insert_own" on public.payments
  for insert with check (auth.uid () = user_id and status = 'pending' and confirmed_at is null and confirmed_by is null);

-- Users may only edit their own pending rows (to save the transfer
-- reference); admins may set the final status.
drop policy if exists "payments_update_access" on public.payments;
create policy "payments_update_access" on public.payments
  for update using (auth.uid () = user_id or public.is_admin ())
  with check (
    (auth.uid () = user_id and status = 'pending' and confirmed_by is null)
    or public.is_admin ()
  );

-- ============================================================
-- 4. Subscriptions — the result of confirmed payments (or a manual
--    grant by an admin). A user is premium while any row's
--    expires_at is in the future.
-- ============================================================
create table if not exists public.subscriptions (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  plan text not null check (plan in ('monthly', 'yearly')),
  payment_id bigint references public.payments (id) on delete set null,
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null
);

alter table public.subscriptions enable row level security;

drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid () = user_id or public.is_admin ());

-- Admins can grant premium time without a payment record.
drop policy if exists "subscriptions_insert_admin" on public.subscriptions;
create policy "subscriptions_insert_admin" on public.subscriptions
  for insert with check (public.is_admin ());

drop policy if exists "subscriptions_delete_admin" on public.subscriptions;
create policy "subscriptions_delete_admin" on public.subscriptions
  for delete using (public.is_admin ());

-- A completed payment extends the subscription stack-overlapping: new
-- time starts after the current limit, never before.
create or replace function public.handle_payment_confirmed ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  duration interval;
  current_until timestamptz;
  base timestamptz;
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    duration := case new.plan when 'yearly' then interval '365 days' else interval '30 days' end;
    select max(expires_at) into current_until
      from public.subscriptions where user_id = new.user_id;
    base := greatest(coalesce(current_until, now()), now());
    insert into public.subscriptions (user_id, plan, payment_id, starts_at, expires_at)
      values (new.user_id, new.plan, new.id, base, base + duration);
  end if;
  return new;
end;
$$;

drop trigger if exists on_payment_confirmed on public.payments;
create trigger on_payment_confirmed
  after update on public.payments
  for each row execute function public.handle_payment_confirmed ();

-- ============================================================
-- 5. Usage events — replaces the localStorage-only usage tally
--    (app/usage.ts) when the team wants global totals.
-- ============================================================
create table if not exists public.usage_events (
  id bigserial primary key,
  event text not null check (event in ('visit', 'engage', 'open', 'depth', 'seconds')),
  session_id text not null,            -- random id generated per browser
  visits int not null default 0,
  engaged int not null default 0,
  opens int not null default 0,
  seconds int not null default 0,
  depth int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.usage_events enable row level security;

-- Anyone (even anonymous visitors) may append events; nobody may read
-- other visitors' rows directly.
drop policy if exists "usage_events_insert" on public.usage_events;
create policy "usage_events_insert" on public.usage_events
  for insert with check (true);

-- Aggregated totals, readable by everyone (the landing page stats panel).
create or replace view public.usage_totals as
  select
    count(*) filter (where event = 'visit')   as visits,
    count(*) filter (where event = 'engage')  as engaged,
    count(*) filter (where event = 'open')    as opens,
    coalesce(sum(seconds), 0)                  as seconds,
    coalesce(max(depth), 0)                    as depth
  from public.usage_events;

grant select on public.usage_totals to anon, authenticated;

-- ============================================================
-- 6. Quiz results — the atlas has a quiz; this lets signed-in
--    users keep a history and the team build a leaderboard.
-- ============================================================
create table if not exists public.quiz_results (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  score int not null default 0,
  total int not null default 0,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.quiz_results enable row level security;

drop policy if exists "quiz_results_select_own" on public.quiz_results;
create policy "quiz_results_select_own" on public.quiz_results
  for select using (auth.uid () = user_id);

drop policy if exists "quiz_results_insert_own" on public.quiz_results;
create policy "quiz_results_insert_own" on public.quiz_results
  for insert with check (auth.uid () = user_id);

-- ============================================================
-- 7. Triggers that keep profiles in sync with auth.users.
-- ============================================================
create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.email, '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user ();

-- Keep profiles.updated_at fresh.
create or replace function public.touch_updated_at ()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_profile_update on public.profiles;
create trigger on_profile_update
  before update on public.profiles
  for each row execute function public.touch_updated_at ();
