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

-- ============================================================
-- 8. Student profile — where someone studies and how far along
--    they are. The account page edits these; the exam pages read
--    them so a student sees their own course level.
--    The self-update policy from section 1 already covers them, and
--    guard_profile_admin still blocks anyone but an admin from
--    touching is_admin.
-- ============================================================
alter table public.profiles add column if not exists university text not null default '';
alter table public.profiles add column if not exists department text not null default '';
alter table public.profiles add column if not exists study_year int not null default 0;
alter table public.profiles add column if not exists specialty text not null default '';

-- ============================================================
-- 9. XP ledger — every point is a row, so a total is always
--    traceable back to what earned it.
--
--    Nobody inserts these from the browser: there is no insert
--    policy at all. Points arrive only through the security
--    definer functions and triggers below, which is what keeps a
--    student from granting themselves a discount.
-- ============================================================
create table if not exists public.xp_events (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('checkin', 'exam_pass', 'spend', 'refund', 'admin_grant')),
  points int not null,                 -- negative for a spend
  day date not null default current_date,
  note text not null default '',
  created_at timestamptz not null default now()
);

-- One attendance claim per day, and nothing stops an exam from being
-- retaken. A partial index is the whole rule.
create unique index if not exists xp_events_checkin_once
  on public.xp_events (user_id, day) where kind = 'checkin';

alter table public.xp_events enable row level security;

drop policy if exists "xp_events_read" on public.xp_events;
create policy "xp_events_read" on public.xp_events
  for select to authenticated using (auth.uid () = user_id or public.is_admin ());

create or replace function public.xp_balance (p_user uuid)
returns int
language sql stable security definer set search_path = public, pg_temp
as $$
  select coalesce (sum (points), 0)::int from public.xp_events where user_id = p_user;
$$;

create or replace function public.my_xp ()
returns int
language sql stable security definer set search_path = public, pg_temp
as $$
  select public.xp_balance (auth.uid ());
$$;

-- Today's attendance. Calling it twice on the same day is not an error:
-- the unique index rejects the second row and the balance just comes back.
create or replace function public.claim_daily_checkin ()
returns int
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  who uuid := auth.uid ();
begin
  if who is null then
    raise exception 'Sign in before claiming attendance.';
  end if;
  begin
    insert into public.xp_events (user_id, kind, points, day)
    values (who, 'checkin', 10, current_date);
  exception when unique_violation then
    null;
  end;
  return public.xp_balance (who);
end;
$$;

-- Admins may hand out points (a competition, a support case) with a note.
create or replace function public.grant_xp (p_user uuid, p_points int, p_note text default '')
returns int
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if not public.is_admin () then
    raise exception 'Only an admin can grant XP.';
  end if;
  insert into public.xp_events (user_id, kind, points, note)
  values (p_user, 'admin_grant', p_points, p_note);
  return public.xp_balance (p_user);
end;
$$;

-- ============================================================
-- 10. Money the browser cannot edit.
--
--    A payment used to trust amount_mnt from the client, so anyone
--    could open devtools and buy premium for 0₮, and an XP
--    discount would have been worse. The trigger now derives the
--    price from the plan, spends XP the balance can actually
--    afford, and freezes those numbers for the life of the order.
--
--    Rates: 1 XP = 5₮, at most 20% of the plan price.
--    Keep plan_price () in step with PLANS in lib/plans.ts.
-- ============================================================
alter table public.payments add column if not exists xp_spent int not null default 0;
alter table public.payments add column if not exists discount_mnt int not null default 0;

create or replace function public.plan_price (p_plan text)
returns int
language sql immutable
as $$
  select case p_plan
    when 'monthly' then 9900
    when 'yearly'  then 49000
    else 0
  end;
$$;

create or replace function public.guard_payment ()
returns trigger
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  price int;
  cap   int;
begin
  if tg_op = 'UPDATE' then
    -- The order's money is fixed once created; only the review fields move.
    new.plan := old.plan;
    new.user_id := old.user_id;
    new.amount_mnt := old.amount_mnt;
    new.discount_mnt := old.discount_mnt;
    new.xp_spent := old.xp_spent;
    if new.status is distinct from old.status and not public.is_admin () then
      raise exception 'Only an admin can change a payment status.';
    end if;
    return new;
  end if;

  price := public.plan_price (new.plan);
  if price = 0 then
    raise exception 'Unknown plan "%".', new.plan;
  end if;
  if new.status <> 'pending' and not public.is_admin () then
    raise exception 'Only an admin can create a settled payment.';
  end if;

  new.xp_spent := greatest (0, coalesce (new.xp_spent, 0));
  cap := floor (price * 0.2 / 5)::int;
  new.xp_spent := greatest (0, least (new.xp_spent, public.xp_balance (new.user_id), cap));
  new.discount_mnt := new.xp_spent * 5;
  new.amount_mnt := price - new.discount_mnt;
  return new;
end;
$$;

drop trigger if exists guard_payment on public.payments;
create trigger guard_payment
  before insert or update on public.payments
  for each row execute function public.guard_payment ();

-- Burn the points the order was allowed to use.
create or replace function public.spend_payment_xp ()
returns trigger
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if new.xp_spent > 0 then
    insert into public.xp_events (user_id, kind, points, note)
    values (new.user_id, 'spend', -new.xp_spent, 'payment ' || new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists spend_payment_xp on public.payments;
create trigger spend_payment_xp
  after insert on public.payments
  for each row execute function public.spend_payment_xp ();

-- A rejected order gives the points back, so a mistake costs nothing.
create or replace function public.refund_payment_xp ()
returns trigger
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if new.status = 'rejected' and old.status = 'pending' and old.xp_spent > 0 then
    insert into public.xp_events (user_id, kind, points, note)
    values (old.user_id, 'refund', old.xp_spent, 'payment ' || old.id || ' rejected');
  end if;
  return new;
end;
$$;

drop trigger if exists refund_payment_xp on public.payments;
create trigger refund_payment_xp
  after update of status on public.payments
  for each row execute function public.refund_payment_xp ();

-- ============================================================
-- 11. Exams — the graded counterpart of the quiz.
--
--    The quiz is open practice and its bank lives in the repo. An
--    exam is a stored paper that a student sits once under a timer,
--    and only rows with status 'published' ever reach a student, so
--    the team (or the assistant's draft endpoint) can prepare
--    questions and check them before anyone answers.
--
--    Scoring is not the browser's job: score_exam_attempt ()
--    recomputes every multiple-choice point from the stored answer
--    keys, so a client cannot post a score it did not earn. Case
--    answers are graded by the model against the question's rubric;
--    the trigger clamps that score to what the question is worth.
-- ============================================================
create table if not exists public.exams (
  id bigserial primary key,
  title text not null,
  title_en text not null default '',
  topic text not null default '',           -- free-text label, e.g. "Дээд мөч"
  level text not null default 'basic' check (level in ('basic', 'clinical')),
  time_limit_min int not null default 15,
  pass_pct int not null default 70,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now()
);

create table if not exists public.exam_questions (
  id bigserial primary key,
  exam_id bigint not null references public.exams (id) on delete cascade,
  position int not null default 0,
  kind text not null default 'mcq' check (kind in ('mcq', 'case')),
  prompt text not null,
  prompt_en text not null default '',
  options jsonb not null default '[]'::jsonb,   -- mcq: the choice labels
  answer int,                                   -- mcq: index into options, null for a case
  rubric text not null default '',              -- case: what a full answer has to name
  concept text not null default '',             -- atlas concept to open from the review
  points int not null default 1
);

create table if not exists public.exam_attempts (
  id bigserial primary key,
  exam_id bigint not null references public.exams (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,   -- {"<question_id>": {"choice": n, "text": "..."}}
  mcq_score int not null default 0,
  case_score int not null default 0,
  case_max int not null default 0,
  total_points int not null default 0,
  score_pct int not null default 0,
  passed boolean not null default false,
  ai_feedback text not null default '',
  xp_awarded int not null default 0,
  duration_sec int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.exams enable row level security;
alter table public.exam_questions enable row level security;
alter table public.exam_attempts enable row level security;

drop policy if exists "exams_read" on public.exams;
create policy "exams_read" on public.exams
  for select to authenticated using (status = 'published' or public.is_admin ());

-- Admins curate the bank; students never write to it.
drop policy if exists "exams_manage" on public.exams;
create policy "exams_manage" on public.exams
  for update to authenticated using (public.is_admin ()) with check (public.is_admin ());
drop policy if exists "exams_insert" on public.exams;
create policy "exams_insert" on public.exams
  for insert to authenticated with check (public.is_admin ());

drop policy if exists "exam_questions_read" on public.exam_questions;
create policy "exam_questions_read" on public.exam_questions
  for select to authenticated using (
    exists (
      select 1 from public.exams e
      where e.id = exam_id and (e.status = 'published' or public.is_admin ())
    )
  );
drop policy if exists "exam_questions_manage" on public.exam_questions;
create policy "exam_questions_manage" on public.exam_questions
  for all to authenticated using (public.is_admin ()) with check (public.is_admin ());

drop policy if exists "exam_attempts_insert" on public.exam_attempts;
create policy "exam_attempts_insert" on public.exam_attempts
  for insert to authenticated with check (auth.uid () = user_id);
drop policy if exists "exam_attempts_read" on public.exam_attempts;
create policy "exam_attempts_read" on public.exam_attempts
  for select to authenticated using (auth.uid () = user_id or public.is_admin ());
-- No update or delete policy: an attempt is a record once handed in.

create or replace function public.score_exam_attempt ()
returns trigger
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  q        record;
  given    jsonb;
  pass_pct int;
  award    int := 0;
begin
  select coalesce (e.pass_pct, 70) into pass_pct from public.exams e where e.id = new.exam_id;
  if not found then
    raise exception 'Exam % does not exist.', new.exam_id;
  end if;

  new.mcq_score := 0;
  new.total_points := 0;
  new.case_max := 0;
  for q in
    select id, kind, answer, points from public.exam_questions where exam_id = new.exam_id order by position, id
  loop
    new.total_points := new.total_points + q.points;
    given := new.answers -> q.id::text;
    if q.kind = 'mcq' then
      -- Text comparison on purpose: a stray non-numeric choice must not abort the insert.
      if q.answer is not null and given is not null and given ->> 'choice' = q.answer::text then
        new.mcq_score := new.mcq_score + q.points;
      end if;
    else
      new.case_max := new.case_max + q.points;
    end if;
  end loop;

  if new.total_points = 0 then
    raise exception 'Exam % has no questions yet.', new.exam_id;
  end if;

  new.case_score := greatest (0, least (coalesce (new.case_score, 0), new.case_max));
  new.score_pct := round ((new.mcq_score + new.case_score) * 100.0 / new.total_points)::int;
  new.passed := new.score_pct >= pass_pct;

  -- XP for the first pass only, so retaking a paper cannot farm points.
  if new.passed and not exists (
    select 1 from public.exam_attempts a
    where a.exam_id = new.exam_id and a.user_id = new.user_id and a.passed
  ) then
    award := 20 + greatest (0, least (20, (new.score_pct - pass_pct) / 2));
    insert into public.xp_events (user_id, kind, points, note)
    values (new.user_id, 'exam_pass', award, 'exam ' || new.exam_id);
    new.xp_awarded := award;
  else
    new.xp_awarded := 0;
  end if;
  return new;
end;
$$;

drop trigger if exists score_exam_attempt on public.exam_attempts;
create trigger score_exam_attempt
  before insert on public.exam_attempts
  for each row execute function public.score_exam_attempt ();

-- ============================================================
-- 12. Two published papers and one draft, so the exam screen has
--     something to sit and the admin screen has something to
--     approve on the first run. Facts are standard anatomy and
--     clinical teaching points; the team owns this content and
--     should review it before it counts toward a grade.
--
--     The block is guarded by the exam title, so re-running the
--     schema never duplicates the bank.
-- ============================================================
do $$
declare
  e_id bigint;
begin
  if not exists (select 1 from public.exams where title = 'Дээд мөч: яс, булчин, мэдрэл') then
    insert into public.exams (title, title_en, topic, level, time_limit_min, pass_pct, status)
    values ('Дээд мөч: яс, булчин, мэдрэл', 'Upper limb: bones, muscles, nerves', 'Дээд мөч', 'clinical', 15, 70, 'published')
    returning id into e_id;

    insert into public.exam_questions (exam_id, position, kind, prompt, prompt_en, options, answer, rubric, concept, points) values
      (e_id, 1, 'mcq', 'Тохойг сунгах үндсэн булчин аль нь вэ?', 'Which muscle is the main extensor of the elbow?',
       '["M. biceps brachii","M. triceps brachii","M. brachialis","M. brachioradialis"]', 1, '', 'triceps brachii', 1),
      (e_id, 2, 'mcq', 'M. biceps brachii-ийг аль мэдрэл даадаг вэ?', 'Which nerve supplies the biceps brachii?',
       '["N. medianus","N. radialis","N. musculocutaneus","N. ulnaris"]', 2, '', 'biceps brachii', 1),
      (e_id, 3, 'mcq', 'Бугалга унах (wrist drop) шинж аль мэдрэл гэмтэхэд илрэх вэ?', 'Which nerve injury causes wrist drop?',
       '["N. ulnaris","N. medianus","N. musculocutaneus","N. radialis"]', 3, '', '', 1),
      (e_id, 4, 'mcq', 'Шөнийн хурууны чиддэг, ерхий хурууны булчин жижигрэх шинж аль даруулалтад илрэх вэ?', 'Night-time numbness with thenar wasting points to which compression?',
       '["Canalis carpi (N. medianus)","Canalis cubitalis (N. ulnaris)","Foramen quadrilaterum (N. axillaris)","Canalis vertebralis"]', 0, '', 'abductor pollicis brevis', 1),
      (e_id, 5, 'mcq', 'Дээд мөчийг 0–15 градус өргөхөд эхэлж ажилладаг rotator cuff-ийн булчин?', 'Which rotator cuff muscle starts abduction of the arm?',
       '["M. supraspinatus","M. infraspinatus","M. subscapularis","M. teres minor"]', 0, '', 'supraspinatus', 1),
      (e_id, 6, 'mcq', 'M. subscapularis-ийн үндсэн үйлдэл аль вэ?', 'What is the main action of the subscapularis?',
       '["Дашраа эргүүлэх","Дотор эргүүлэх (medial rotation)","Гадаа эргүүлэх","Тохой нугалах"]', 1, '', 'subscapularis', 1),
      (e_id, 7, 'mcq', 'Scapula-ийн далавч хэлбэрийн хөдөлгөөн (winged scapula) аль мэдрэлийн гэмтлээс үүсдэг вэ?', 'Winging of the scapula follows injury to which nerve?',
       '["N. thoracicus longus","N. axillaris","N. medianus","N. suprascapularis"]', 0, '', '', 1),
      (e_id, 8, 'mcq', 'Диафрагмыг аль мэдрэл даадаг вэ?', 'Which nerve supplies the diaphragm?',
       '["N. phrenicus","N. vagus","N. intercostalis","N. accessorius"]', 0, '', 'diaphragm', 1),
      (e_id, 9, 'case', '42 настай эмэгтэй шөнийн үед хурууныяа мэдрэгдэхүй алга болдог, гараа савлаж тайлдаг. Сүүлийн хэдэн сарад ерхий хурууны үндсийн булчин жижигхэн харагдах болсон. 1) Аль мэдрэл даруулагдаж байгааг, 2) шинжилгээнд ашиглах 2 клиник тестийг, 3) яагаад дунд хурууны арьс мэдрэггүй болохыг товч бичнэ үү.',
       'A 42-year-old woman has night-time finger numbness relieved by shaking the hand, with recent wasting at the base of the thumb. Name the compressed nerve, two clinical tests, and why the middle finger loses sensation.',
       '[]', null, 'Бүтэн хариулт: N. medianus-ийн canalis carpi-д даруулагдах (carpal tunnel syndrome); тест Phalen болон Tinel; дунд хурууны мэдрэглэлтийг мөн N. medianus хангадаг; thenar булчин (M. abductor pollicis brevis) атрофи нь удаан даруулалтын шинж.', 'abductor pollicis brevis', 2),
      (e_id, 10, 'case', 'Өвчтөний Humerus-ын дунд хэсэг хагарсны дараа бугалга доош унаж, гарын арлын 1.5 хурууны арьс мэдрэггүй болсон. 1) Аль мэдрэл гэмтсэнийг, 2) аль булчингийн бүлэг ажиллахаа болихыг, 3) яагаад бугалга унадагийг тайлбарла.',
       'After a mid-shaft humerus fracture a man has a dropped wrist and numb skin on the back of the lateral 1.5 fingers. Name the nerve, the muscle group that fails, and why the wrist drops.',
       '[]', null, 'Бүтэн хариулт: N. radialis гэмтэл; өмнө хэсгийн extensor бүлэг (M. extensor carpi radialis longus/brevis, M. extensor digitorum) сулрана; flexor булчингууд давамгайлж бугалга доош унана.', '', 2);
  end if;

  if not exists (select 1 from public.exams where title = 'Доод мөч, тавхай, холбын') then
    insert into public.exams (title, title_en, topic, level, time_limit_min, pass_pct, status)
    values ('Доод мөч, тавхай, холбын', 'Lower limb, foot and ligaments', 'Доод мөч', 'basic', 12, 70, 'published')
    returning id into e_id;

    insert into public.exam_questions (exam_id, position, kind, prompt, prompt_en, options, answer, rubric, concept, points) values
      (e_id, 1, 'mcq', 'Өвдгийг сунгах үндсэн булчингийн бүлэг?', 'Which muscle group extends the knee?',
       '["Mm. hamstrings","M. quadriceps femoris","M. gastrocnemius","M. tibialis anterior"]', 1, '', 'femur', 1),
      (e_id, 2, 'mcq', 'M. quadriceps femoris-ийг аль мэдрэл даадаг вэ?', 'Which nerve supplies the quadriceps femoris?',
       '["N. ischiadicus","N. femoralis","N. obturatorius","N. fibularis communis"]', 1, '', '', 1),
      (e_id, 3, 'mcq', 'Ахиллын рефлексийг (S1–S2) шалгахад аль булчин агших вэ?', 'Which muscle contracts in the Achilles reflex?',
       '["M. tibialis anterior","M. quadriceps femoris","M. gastrocnemius / soleus","M. peroneus longus"]', 2, '', 'head of gastrocnemius', 1),
      (e_id, 4, 'mcq', 'Хөлийн оёор дээш татах чадваргүй (foot drop) болох нь аль мэдрэлийн гэмтлийн шинж вэ?', 'Foot drop is a sign of injury to which nerve?',
       '["N. tibialis","N. fibularis communis","N. femoralis","N. gluteus superior"]', 1, '', '', 1),
      (e_id, 5, 'mcq', 'Антиор drawer тест өвдгийн аль холыг шалгах вэ?', 'The anterior drawer test examines which ligament of the knee?',
       '["Lig. cruciatum posterius","Lig. cruciatum anterius","Lig. collaterale mediale","Lig. patellae"]', 1, '', 'anterior cruciate ligament', 1),
      (e_id, 6, 'mcq', 'Нэг талын M. sternocleidomastoid агшихад толгой хэрхэн хөдлөх вэ?', 'Unilateral sternocleidomastoid contraction moves the head how?',
       '["Нүдээ нээж доош харна","Эсрэг тал руу эргэж, ижил тал руу налуу","Хойш налуу","Хажуу тал руу зөвхөн налуу"]', 1, '', 'sternocleidomastoid', 1),
      (e_id, 7, 'case', '58 настай өвчтөний Fibula-ийн хүзүүвч хэсэгт гэмтэл авсны дараа хөлийн оёор дээш татах чадваргүй, хөлийн гадна тал болон хурууны арлын арьс мэдрэггүй болсон. 1) Аль мэдрэл гэмтсэнийг, 2) яагаад хөлийн оёор «цойлдог» алхаа үүсэхийг тайлбарла.',
       'After injury at the neck of the fibula a 58-year-old cannot dorsiflex the foot and has numb skin on the lateral leg and dorsum of the foot. Name the nerve and explain the resulting steppage gait.',
       '[]', null, 'Бүтэн хариулт: N. fibularis communis (peroneus) Fibula-ийн хүзүүвч дээр гэмтэнэ; dorsiflexor бүлэг (M. tibialis anterior, Mm. fibulares) сулран өмнө хэсэгт татагдах тул өвчтөн хөллөө өргөж алхах (steppage gait) болно.', '', 2);
  end if;

  -- A draft paper: students never see it until an admin publishes it.
  if not exists (select 1 from public.exams where title = 'Зүрх, судас (бэлтгэл)') then
    insert into public.exams (title, title_en, topic, level, time_limit_min, pass_pct, status)
    values ('Зүрх, судас (бэлтгэл)', 'Heart and vessels (draft)', 'Зүрх', 'basic', 5, 70, 'draft')
    returning id into e_id;

    insert into public.exam_questions (exam_id, position, kind, prompt, prompt_en, options, answer, rubric, concept, points) values
      (e_id, 1, 'mcq', 'Зүрхний зүүн ховдолгоос цус аль гуурас руу гарах вэ?', 'Blood leaves the left ventricle through which vessel?',
       '["Truncus pulmonalis","Aorta ascendens","Vena cava superior","A. pulmonalis sinistra"]', 1, '', 'heart', 1),
      (e_id, 2, 'case', 'Альвеолын ханыг дайран ямар хий солигддог, тэр солилцоог хангах 2 бүтцийн онцгийг бичнэ үү.',
       'Name the two gas exchange directions across the alveolar wall and two structural features that make the exchange efficient.',
       '[]', null, 'Бүтэн хариулт: O₂ агаараас цус руу, CO₂ цуснаас агаар руу; онц: альвеол ба капиллярын хан хос эсийн давхаргаас нимгэн (эсийн мембран ба эндотел) ба их талбай / сайн цусны эргэлт.', '', 2);
  end if;
end;
$$;
