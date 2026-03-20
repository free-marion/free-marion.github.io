-- ============================================
-- Cherrywood Team Portal — Database Setup
-- Run this in the Supabase SQL Editor:
--   Dashboard → SQL Editor → New query → paste → Run
-- ============================================

-- Profiles (auto-created for each auth user)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  role text default 'member',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Rocks (90-day priorities)
create table if not exists rocks (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users not null,
  owner_name text,
  title text not null,
  description text,
  due_date date,
  status text not null default 'on_track',   -- on_track | off_track | complete
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Measurables (scorecard metrics)
create table if not exists measurables (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users not null,
  metric_name text not null,
  goal_value numeric,
  goal_direction text not null default 'gte',  -- gte | lte
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Scores (weekly entries)
create table if not exists scores (
  id uuid default gen_random_uuid() primary key,
  measurable_id uuid references measurables on delete cascade not null,
  week_start date not null,
  value numeric not null,
  entered_by uuid references auth.users not null,
  created_at timestamptz default now(),
  unique (measurable_id, week_start)
);

-- Issues List
create table if not exists issues (
  id uuid default gen_random_uuid() primary key,
  created_by uuid references auth.users not null,
  title text not null,
  description text,
  priority text not null default 'normal',   -- normal | high
  status text not null default 'open',       -- open | discussing | solved
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---- RLS ----
alter table profiles    enable row level security;
alter table rocks       enable row level security;
alter table measurables enable row level security;
alter table scores      enable row level security;
alter table issues      enable row level security;

-- Drop existing policies if re-running
drop policy if exists "Users can read all profiles"      on profiles;
drop policy if exists "Users can update own profile"     on profiles;
drop policy if exists "Users can read all rocks"         on rocks;
drop policy if exists "Users can manage own rocks"       on rocks;
drop policy if exists "Users can read all measurables"   on measurables;
drop policy if exists "Users can manage own measurables" on measurables;
drop policy if exists "Users can read all scores"        on scores;
drop policy if exists "Authenticated can insert scores"  on scores;
drop policy if exists "Score entrant can update score"   on scores;
drop policy if exists "Users can read all issues"        on issues;
drop policy if exists "Authenticated can create issues"  on issues;
drop policy if exists "Issue creator can update"         on issues;
drop policy if exists "Issue creator can delete"         on issues;

-- Profiles
create policy "Users can read all profiles"  on profiles for select  using (auth.uid() is not null);
create policy "Users can update own profile" on profiles for update  using (auth.uid() = id);

-- Rocks
create policy "Users can read all rocks"   on rocks for select using (auth.uid() is not null);
create policy "Users can manage own rocks" on rocks for all    using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Measurables
create policy "Users can read all measurables"   on measurables for select using (auth.uid() is not null);
create policy "Users can manage own measurables" on measurables for all    using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Scores
create policy "Users can read all scores"       on scores for select using (auth.uid() is not null);
create policy "Authenticated can insert scores" on scores for insert with check (auth.uid() is not null);
create policy "Score entrant can update score"  on scores for update using (auth.uid() = entered_by);

-- Issues
create policy "Users can read all issues"      on issues for select using (auth.uid() is not null);
create policy "Authenticated can create issues"on issues for insert with check (auth.uid() is not null);
create policy "Issue creator can update"       on issues for update using (auth.uid() = created_by);
create policy "Issue creator can delete"       on issues for delete using (auth.uid() = created_by);

-- ---- Triggers ----
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists set_rocks_updated_at       on rocks;
drop trigger if exists set_measurables_updated_at on measurables;
drop trigger if exists set_issues_updated_at      on issues;
drop trigger if exists set_profiles_updated_at    on profiles;

create trigger set_rocks_updated_at       before update on rocks       for each row execute procedure set_updated_at();
create trigger set_measurables_updated_at before update on measurables for each row execute procedure set_updated_at();
create trigger set_issues_updated_at      before update on issues      for each row execute procedure set_updated_at();
create trigger set_profiles_updated_at    before update on profiles    for each row execute procedure set_updated_at();

-- Auto-create profile on sign-up
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Indexes
create index if not exists rocks_owner_idx        on rocks (owner_id);
create index if not exists measurables_owner_idx  on measurables (owner_id);
create index if not exists scores_measurable_idx  on scores (measurable_id, week_start);
create index if not exists issues_status_idx      on issues (status);
