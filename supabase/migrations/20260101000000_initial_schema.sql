-- =============================================================
-- Cherrywood Farm & Golf Club — Complete Schema
-- Single canonical migration. Run via: supabase db reset
-- =============================================================


-- =============================================================
-- FUNCTIONS (must exist before triggers)
-- =============================================================

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create or replace function public.portal_can(perm_col text)
returns boolean language plpgsql security definer stable
set search_path = public as $$
declare result boolean;
begin
  if perm_col = 'admin' then
    select (role = 'admin') into result from public.profiles where id = auth.uid();
  else
    execute format(
      'select coalesce(%I, false) or role = ''admin'' from public.profiles where id = $1',
      perm_col
    ) into result using auth.uid();
  end if;
  return coalesce(result, false);
end;
$$;

create or replace function sync_tournament_registered_count()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    if NEW.status = 'confirmed' then
      update tournaments set registered_count = registered_count + 1 where id = NEW.tournament_id;
    end if;
    return NEW;
  elsif TG_OP = 'UPDATE' then
    if OLD.status != 'confirmed' and NEW.status = 'confirmed' then
      update tournaments set registered_count = registered_count + 1 where id = NEW.tournament_id;
    elsif OLD.status = 'confirmed' and NEW.status != 'confirmed' then
      update tournaments set registered_count = greatest(0, registered_count - 1) where id = NEW.tournament_id;
    end if;
    return NEW;
  elsif TG_OP = 'DELETE' then
    if OLD.status = 'confirmed' then
      update tournaments set registered_count = greatest(0, registered_count - 1) where id = OLD.tournament_id;
    end if;
    return OLD;
  end if;
end;
$$;


-- =============================================================
-- TABLES
-- =============================================================

-- Profiles (extends auth.users)
create table if not exists profiles (
  id                      uuid references auth.users on delete cascade primary key,
  display_name            text,
  name                    text,
  email                   text,
  role                    text not null default 'member',
  perm_cancel_bookings    boolean not null default false,
  perm_mark_eggs          boolean not null default false,
  perm_manage_tournaments boolean not null default false,
  perm_view_members       boolean not null default false,
  perm_toggle_course      boolean not null default false,
  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

-- Tournaments (public-facing events)
create table if not exists tournaments (
  id               uuid default gen_random_uuid() primary key,
  name             text not null,
  date             date not null,
  time             text,
  description      text,
  type             text not null default 'individual',
  team_size        int,
  max_slots        int not null default 0,
  format           text,
  entry_fee        numeric,
  status           text not null default 'open' check (status in ('open','closed','cancelled','draft')),
  notes            text,
  registered_count int not null default 0,
  created_at       timestamptz default now()
);

-- Tournament registrations
create table if not exists tournament_registrations (
  id            uuid default gen_random_uuid() primary key,
  tournament_id uuid references tournaments on delete cascade not null,
  team_name     text,
  captain_name  text,
  phone         text,
  email         text,
  num_players   int not null default 1,
  cart          boolean not null default false,
  status        text not null default 'confirmed',
  created_at    timestamptz default now()
);

-- Egg orders (public-facing form)
create table if not exists egg_orders (
  id          uuid default gen_random_uuid() primary key,
  name        text not null,
  contact     text not null,
  dozens      int not null default 1,
  pickup_date date,
  notes       text,
  status      text not null default 'pending',
  created_at  timestamptz default now()
);

-- Course status (singleton, id always = 1)
create table if not exists course_status (
  id         int primary key default 1 check (id = 1),
  is_open    boolean not null default true,
  message    text not null default 'Course is closed due to weather conditions. Check back soon.',
  closed_on  date,
  updated_at timestamptz default now()
);

-- Tee time bookings
create table if not exists bookings (
  id              uuid default gen_random_uuid() primary key,
  confirmation_no text unique not null,
  slot_time       timestamptz not null,
  name            text not null,
  phone           text not null,
  email           text,
  num_players     int not null default 1,
  num_carts       int not null default 0,
  holes           int not null default 9,
  status          text not null default 'confirmed',
  notes           text,
  created_at      timestamptz default now()
);

-- Tee time blocks (admin-managed)
create table if not exists blocks (
  id        uuid default gen_random_uuid() primary key,
  from_time timestamptz not null,
  to_time   timestamptz not null,
  reason    text
);

-- Rocks (EOS quarterly goals)
create table if not exists rocks (
  id          uuid default gen_random_uuid() primary key,
  owner_id    uuid references auth.users not null,
  owner_name  text,
  title       text not null,
  description text,
  due_date    date,
  status      text not null default 'on_track',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Measurables (scorecard metrics)
create table if not exists measurables (
  id             uuid default gen_random_uuid() primary key,
  owner_id       uuid references auth.users not null,
  metric_name    text not null,
  goal_value     numeric,
  goal_direction text not null default 'gte',
  sort_order     int not null default 0,
  active         boolean not null default true,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- Scores (weekly measurable values)
create table if not exists scores (
  id            uuid default gen_random_uuid() primary key,
  measurable_id uuid references measurables on delete cascade not null,
  week_start    date not null,
  value         numeric not null,
  entered_by    uuid references auth.users not null,
  created_at    timestamptz default now(),
  unique (measurable_id, week_start)
);

-- Issues (EOS IDS list)
create table if not exists issues (
  id          uuid default gen_random_uuid() primary key,
  created_by  uuid references auth.users not null,
  title       text not null,
  description text,
  priority    text not null default 'normal',
  status      text not null default 'open',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- To-Dos
create table if not exists todos (
  id           uuid default gen_random_uuid() primary key,
  owner_id     uuid references auth.users not null,
  owner_name   text,
  title        text not null,
  due_date     date,
  done         boolean not null default false,
  week_created date not null default date_trunc('week', current_date)::date,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Meeting logs
create table if not exists meeting_logs (
  id                  uuid default gen_random_uuid() primary key,
  meeting_date        date not null default current_date,
  rating              int,
  segue_notes         text,
  headlines           text,
  cascading_messages  text,
  created_by          uuid references auth.users not null,
  created_at          timestamptz default now()
);

-- V/TO (singleton)
create table if not exists vto (
  id                   int primary key default 1 check (id = 1),
  core_values          text not null default '[]',
  core_focus_purpose   text not null default '',
  core_focus_niche     text not null default '',
  ten_year_target      text not null default '',
  mktg_target_market   text not null default '',
  mktg_uniques         text not null default '[]',
  mktg_proven_process  text not null default '',
  mktg_guarantee       text not null default '',
  three_year_picture   text not null default '',
  one_year_plan        text not null default '',
  updated_by           uuid references auth.users,
  updated_at           timestamptz default now()
);

-- Accountability chart nodes
create table if not exists accountability_nodes (
  id          uuid default gen_random_uuid() primary key,
  role_name   text not null,
  person_name text,
  parent_id   uuid references accountability_nodes(id) on delete set null,
  sort_order  int not null default 0,
  created_at  timestamptz default now()
);


-- =============================================================
-- SINGLETON ROWS
-- =============================================================

insert into course_status (id) values (1) on conflict do nothing;
insert into vto (id) values (1) on conflict do nothing;


-- =============================================================
-- RLS
-- =============================================================

alter table profiles             enable row level security;
alter table tournaments          enable row level security;
alter table tournament_registrations enable row level security;
alter table egg_orders           enable row level security;
alter table course_status        enable row level security;
alter table bookings             enable row level security;
alter table blocks               enable row level security;
alter table rocks                enable row level security;
alter table measurables          enable row level security;
alter table scores               enable row level security;
alter table issues               enable row level security;
alter table todos                enable row level security;
alter table meeting_logs         enable row level security;
alter table vto                  enable row level security;
alter table accountability_nodes enable row level security;

-- profiles
create policy "Users can read all profiles"    on profiles for select using (auth.uid() is not null);
create policy "Users can update own profile"   on profiles for update using (auth.uid() = id);
create policy "Admin can update any profile"   on profiles for update
  using (public.portal_can('admin')) with check (public.portal_can('admin'));

-- tournaments
-- Public site reads tournaments; only authenticated portal user writes.
create policy "Anyone can read tournaments"             on tournaments for select using (true);
create policy "Authenticated can insert tournament"     on tournaments for insert with check (auth.uid() is not null);
create policy "Authenticated can update tournament"     on tournaments for update using (auth.uid() is not null);
create policy "Authenticated can delete tournament"     on tournaments for delete using (auth.uid() is not null);

-- tournament_registrations
-- Public site reads and submits registrations; only authenticated portal user can modify or delete.
create policy "Anyone can read tournament registrations"      on tournament_registrations for select using (true);
create policy "Anyone can register for tournament"            on tournament_registrations for insert with check (true);
create policy "Authenticated can update registration"         on tournament_registrations for update using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Authenticated can delete registration"         on tournament_registrations for delete using (auth.uid() is not null);

-- egg_orders
-- Public site submits and reads egg orders; only authenticated portal user can update status.
create policy "Anyone can submit egg order"             on egg_orders for insert with check (true);
create policy "Anyone can read egg orders"              on egg_orders for select using (true);
create policy "Authenticated can update egg order"      on egg_orders for update using (auth.uid() is not null) with check (auth.uid() is not null);

-- course_status
create policy "Anyone can read course status"           on course_status for select using (true);
create policy "Authenticated can update course status"  on course_status for update using (auth.uid() is not null);

-- bookings
create policy "Anyone can create booking"  on bookings for insert with check (true);
create policy "Anyone can read bookings"   on bookings for select using (true);
create policy "Authorized can update booking" on bookings for update
  using (public.portal_can('perm_cancel_bookings'));

-- blocks
create policy "Anyone can read blocks" on blocks for select using (true);

-- rocks
create policy "Users can read all rocks"    on rocks for select using (auth.uid() is not null);
create policy "Users can manage own rocks"  on rocks for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- measurables
create policy "Users can read all measurables"   on measurables for select using (auth.uid() is not null);
create policy "Users can manage own measurables" on measurables for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- scores
create policy "Users can read all scores"       on scores for select using (auth.uid() is not null);
create policy "Authenticated can insert scores" on scores for insert with check (auth.uid() is not null);
create policy "Score entrant can update score"  on scores for update using (auth.uid() = entered_by);

-- issues
create policy "Users can read all issues"       on issues for select using (auth.uid() is not null);
create policy "Authenticated can create issues" on issues for insert with check (auth.uid() is not null);
create policy "Issue creator can update"        on issues for update using (auth.uid() = created_by);
create policy "Issue creator can delete"        on issues for delete using (auth.uid() = created_by);

-- todos
create policy "Users can read all todos"         on todos for select using (auth.uid() is not null);
create policy "Authenticated can create todos"   on todos for insert with check (auth.uid() is not null);
create policy "Todo owner can update"            on todos for update using (auth.uid() = owner_id);
create policy "Todo owner can delete"            on todos for delete using (auth.uid() = owner_id);

-- meeting_logs
create policy "Users can read meeting logs"   on meeting_logs for select using (auth.uid() is not null);
create policy "Authenticated can log meetings" on meeting_logs for insert with check (auth.uid() is not null);

-- vto
create policy "Authenticated can read vto"   on vto for select using (auth.uid() is not null);
create policy "Authenticated can update vto" on vto for update
  using (auth.uid() is not null) with check (auth.uid() is not null);

-- accountability_nodes
create policy "Authenticated can read nodes"   on accountability_nodes for select using (auth.uid() is not null);
create policy "Authenticated can manage nodes" on accountability_nodes for all
  using (auth.uid() is not null) with check (auth.uid() is not null);


-- =============================================================
-- TRIGGERS
-- =============================================================

drop trigger if exists on_auth_user_created        on auth.users;
drop trigger if exists set_profiles_updated_at     on profiles;
drop trigger if exists set_rocks_updated_at        on rocks;
drop trigger if exists set_measurables_updated_at  on measurables;
drop trigger if exists set_issues_updated_at       on issues;
drop trigger if exists set_todos_updated_at        on todos;
drop trigger if exists trg_tournament_registered_count on tournament_registrations;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

create trigger set_profiles_updated_at    before update on profiles    for each row execute procedure set_updated_at();
create trigger set_rocks_updated_at       before update on rocks       for each row execute procedure set_updated_at();
create trigger set_measurables_updated_at before update on measurables for each row execute procedure set_updated_at();
create trigger set_issues_updated_at      before update on issues      for each row execute procedure set_updated_at();
create trigger set_todos_updated_at       before update on todos       for each row execute procedure set_updated_at();

create trigger trg_tournament_registered_count
  after insert or update or delete on tournament_registrations
  for each row execute function sync_tournament_registered_count();


-- =============================================================
-- INDEXES
-- =============================================================

create index if not exists bookings_slot_time_idx      on bookings (slot_time);
create index if not exists blocks_from_to_idx          on blocks (from_time, to_time);
create index if not exists rocks_owner_idx             on rocks (owner_id);
create index if not exists measurables_owner_idx       on measurables (owner_id);
create index if not exists scores_measurable_idx       on scores (measurable_id, week_start);
create index if not exists issues_status_idx           on issues (status);
create index if not exists todos_owner_idx             on todos (owner_id);
create index if not exists todos_week_idx              on todos (week_created);
create index if not exists meeting_logs_date_idx       on meeting_logs (meeting_date);
create index if not exists nodes_parent_idx            on accountability_nodes (parent_id);
create index if not exists reg_tournament_idx          on tournament_registrations (tournament_id);
