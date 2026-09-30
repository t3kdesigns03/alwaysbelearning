-- ─────────────────────────────────────────────────────────────
-- ABL — Always Be Learning · V1 schema
-- Run once in Supabase → SQL Editor (or `supabase db push`).
-- No passwords, no PINs, no secrets in this file.
-- ─────────────────────────────────────────────────────────────

create extension if not exists pgcrypto;

-- ── profiles ─────────────────────────────────────────────────
create table if not exists public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  display_name    text not null unique check (display_name in ('Booty', 'JO', 'Dad')),
  role            text not null check (role in ('parent', 'learner')),
  grade           int  null check (grade in (7, 11)),
  pin_set         boolean not null default false,
  pin_hash        text null,            -- learners only · scrypt one-way hash · never the raw PIN
  pin_failed_at   timestamptz null,
  pin_fail_count  int not null default 0,
  created_at      timestamptz not null default now(),
  constraint parent_has_no_pin check (role = 'learner' or pin_hash is null),
  constraint learner_has_grade check (role = 'parent' or grade is not null)
);

-- ── courses (data-driven so Dad can add real elective names later) ──
create table if not exists public.courses (
  id          uuid primary key default gen_random_uuid(),
  learner_id  uuid not null references public.profiles (id) on delete cascade,
  label       text not null check (char_length(label) between 1 and 80),
  sort_order  int  not null default 100,
  created_at  timestamptz not null default now(),
  unique (learner_id, label)
);

-- ── per learner × subject stats ─────────────────────────────
create table if not exists public.learner_subject_stats (
  learner_id     uuid not null references public.profiles (id) on delete cascade,
  subject_label  text not null,
  difficulty     int  not null default 3 check (difficulty between 1 and 5),  -- we start pushing at 3
  missions       int  not null default 0,
  last_score     int  null,
  best_score     int  null,
  streak         int  not null default 0,
  points         int  not null default 0,
  last_flown_on  date null,               -- America/Chicago calendar day, drives streak
  updated_at     timestamptz not null default now(),
  primary key (learner_id, subject_label)
);

-- ── missions ─────────────────────────────────────────────────
create table if not exists public.missions (
  id             uuid primary key default gen_random_uuid(),
  learner_id     uuid not null references public.profiles (id) on delete cascade,
  flown_by       uuid not null references public.profiles (id) on delete cascade, -- = learner, or Dad as coach
  subject_label  text not null,
  topic          text not null,
  note           text null,
  unit           text null,
  lesson         text null,
  grade          int  not null,
  difficulty     int  not null check (difficulty between 1 and 5),
  payload        jsonb not null,          -- full MissionPayload incl. answers — never sent raw to the client
  score          int  null check (score between 0 and 8),
  bonus_correct  boolean null,
  completed_at   timestamptz null,
  created_at     timestamptz not null default now()
);
create index if not exists missions_learner_created on public.missions (learner_id, created_at desc);

-- ── answers ──────────────────────────────────────────────────
create table if not exists public.answers (
  id            uuid primary key default gen_random_uuid(),
  mission_id    uuid not null references public.missions (id) on delete cascade,
  question_id   text not null,
  raw_answer    text null,
  choice_index  int  null,
  is_correct    boolean not null,
  feedback      text null,
  created_at    timestamptz not null default now(),
  unique (mission_id, question_id)
);

-- ── default course seeding (mirrors src/lib/courses.ts) ─────
create or replace function public.seed_default_courses()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role = 'learner' and new.grade = 11 then
    insert into public.courses (learner_id, label, sort_order) values
      (new.id, 'English 11 A', 1),
      (new.id, 'Algebra 2 A', 2),
      (new.id, 'Environmental Science A', 3),
      (new.id, 'High School Health', 4),
      (new.id, 'Marketing Foundations 1 A', 5),
      (new.id, 'Personal Finance', 6)
    on conflict do nothing;
  elsif new.role = 'learner' and new.grade = 7 then
    insert into public.courses (learner_id, label, sort_order) values
      (new.id, 'Language Arts 7', 1),
      (new.id, 'Math 7', 2),
      (new.id, 'Science 7', 3),
      (new.id, 'Social Studies 7', 4),
      (new.id, 'Health', 5),
      (new.id, 'Physical Education', 6),
      (new.id, 'Music / Band', 7),
      (new.id, 'Art', 8)
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_seed_courses on public.profiles;
create trigger profiles_seed_courses
  after insert on public.profiles
  for each row execute function public.seed_default_courses();

-- ── helpers ──────────────────────────────────────────────────
create or replace function public.is_parent()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'parent');
$$;

-- ── Row Level Security ──────────────────────────────────────
alter table public.profiles               enable row level security;
alter table public.courses                enable row level security;
alter table public.learner_subject_stats  enable row level security;
alter table public.missions               enable row level security;
alter table public.answers                enable row level security;

-- Nothing for anon. The crew picker goes through /api/crew (server).
revoke all on public.profiles, public.courses, public.learner_subject_stats,
              public.missions, public.answers from anon;

-- profiles: she reads her own row; Dad reads everyone. PIN columns are never selectable.
revoke all on public.profiles from authenticated;
grant select (id, display_name, role, grade, pin_set, created_at) on public.profiles to authenticated;

drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_parent());

-- courses: learner reads hers; Dad reads all and curates the list.
grant select, insert, update, delete on public.courses to authenticated;
drop policy if exists courses_read on public.courses;
create policy courses_read on public.courses
  for select to authenticated
  using (learner_id = auth.uid() or public.is_parent());
drop policy if exists courses_parent_write on public.courses;
create policy courses_parent_write on public.courses
  for all to authenticated
  using (public.is_parent())
  with check (public.is_parent());

-- stats / missions / answers: read own (Dad reads both). Writes happen only in
-- server functions with the service role, so scores can't be edited from a browser.
grant select on public.learner_subject_stats, public.missions, public.answers to authenticated;

drop policy if exists stats_read on public.learner_subject_stats;
create policy stats_read on public.learner_subject_stats
  for select to authenticated
  using (learner_id = auth.uid() or public.is_parent());

drop policy if exists missions_read on public.missions;
create policy missions_read on public.missions
  for select to authenticated
  using (learner_id = auth.uid() or public.is_parent());

drop policy if exists answers_read on public.answers;
create policy answers_read on public.answers
  for select to authenticated
  using (
    public.is_parent()
    or exists (select 1 from public.missions m where m.id = mission_id and m.learner_id = auth.uid())
  );

-- Hide the answer key column-wise too: the browser never needs raw payload.
revoke select on public.missions from authenticated;
grant select (id, learner_id, flown_by, subject_label, topic, note, unit, lesson, grade,
              difficulty, score, bonus_correct, completed_at, created_at)
  on public.missions to authenticated;
