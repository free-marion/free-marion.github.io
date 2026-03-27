-- ============================================
-- Cherrywood Team Portal — COMPLETE SETUP + DATA
-- Paste this entire block into Supabase SQL Editor
-- and click Run. Safe to re-run.
-- ============================================


-- ============================================
-- PART 1: TABLES (setup)
-- ============================================

-- Profiles
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  role text default 'member',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Rocks
create table if not exists rocks (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users not null,
  owner_name text,
  title text not null,
  description text,
  due_date date,
  status text not null default 'on_track',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Measurables
create table if not exists measurables (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users not null,
  metric_name text not null,
  goal_value numeric,
  goal_direction text not null default 'gte',
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Scores
create table if not exists scores (
  id uuid default gen_random_uuid() primary key,
  measurable_id uuid references measurables on delete cascade not null,
  week_start date not null,
  value numeric not null,
  entered_by uuid references auth.users not null,
  created_at timestamptz default now(),
  unique (measurable_id, week_start)
);

-- Issues
create table if not exists issues (
  id uuid default gen_random_uuid() primary key,
  created_by uuid references auth.users not null,
  title text not null,
  description text,
  priority text not null default 'normal',
  status text not null default 'open',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- To-Dos
create table if not exists todos (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users not null,
  owner_name text,
  title text not null,
  due_date date,
  done boolean not null default false,
  week_created date not null default date_trunc('week', current_date)::date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Meeting logs
create table if not exists meeting_logs (
  id uuid default gen_random_uuid() primary key,
  meeting_date date not null default current_date,
  rating int,
  segue_notes text,
  headlines text,
  cascading_messages text,
  created_by uuid references auth.users not null,
  created_at timestamptz default now()
);

-- V/TO (singleton)
create table if not exists vto (
  id int primary key default 1 check (id = 1),
  core_values text not null default '[]',
  core_focus_purpose text not null default '',
  core_focus_niche text not null default '',
  ten_year_target text not null default '',
  mktg_target_market text not null default '',
  mktg_uniques text not null default '[]',
  mktg_proven_process text not null default '',
  mktg_guarantee text not null default '',
  three_year_picture text not null default '',
  one_year_plan text not null default '',
  updated_by uuid references auth.users,
  updated_at timestamptz default now()
);

insert into vto (id) values (1) on conflict do nothing;

-- Accountability chart
create table if not exists accountability_nodes (
  id uuid default gen_random_uuid() primary key,
  role_name text not null,
  person_name text,
  parent_id uuid references accountability_nodes(id) on delete set null,
  sort_order int not null default 0,
  created_at timestamptz default now()
);


-- ============================================
-- PART 2: RLS POLICIES
-- ============================================

alter table profiles             enable row level security;
alter table rocks                enable row level security;
alter table measurables          enable row level security;
alter table scores               enable row level security;
alter table issues               enable row level security;
alter table todos                enable row level security;
alter table meeting_logs         enable row level security;
alter table vto                  enable row level security;
alter table accountability_nodes enable row level security;

drop policy if exists "Users can read all profiles"           on profiles;
drop policy if exists "Users can update own profile"          on profiles;
drop policy if exists "Users can read all rocks"              on rocks;
drop policy if exists "Users can manage own rocks"            on rocks;
drop policy if exists "Users can read all measurables"        on measurables;
drop policy if exists "Users can manage own measurables"      on measurables;
drop policy if exists "Users can read all scores"             on scores;
drop policy if exists "Authenticated can insert scores"       on scores;
drop policy if exists "Score entrant can update score"        on scores;
drop policy if exists "Users can read all issues"             on issues;
drop policy if exists "Authenticated can create issues"       on issues;
drop policy if exists "Issue creator can update"              on issues;
drop policy if exists "Issue creator can delete"              on issues;
drop policy if exists "Users can read all todos"              on todos;
drop policy if exists "Authenticated can create todos"        on todos;
drop policy if exists "Todo owner can update"                 on todos;
drop policy if exists "Todo owner can delete"                 on todos;
drop policy if exists "Users can read meeting logs"           on meeting_logs;
drop policy if exists "Authenticated can log meetings"        on meeting_logs;
drop policy if exists "Authenticated can read vto"            on vto;
drop policy if exists "Authenticated can update vto"          on vto;
drop policy if exists "Authenticated can read nodes"          on accountability_nodes;
drop policy if exists "Authenticated can manage nodes"        on accountability_nodes;

create policy "Users can read all profiles"      on profiles    for select using (auth.uid() is not null);
create policy "Users can update own profile"     on profiles    for update using (auth.uid() = id);
create policy "Users can read all rocks"         on rocks       for select using (auth.uid() is not null);
create policy "Users can manage own rocks"       on rocks       for all    using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "Users can read all measurables"   on measurables for select using (auth.uid() is not null);
create policy "Users can manage own measurables" on measurables for all    using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "Users can read all scores"        on scores      for select using (auth.uid() is not null);
create policy "Authenticated can insert scores"  on scores      for insert with check (auth.uid() is not null);
create policy "Score entrant can update score"   on scores      for update using (auth.uid() = entered_by);
create policy "Users can read all issues"        on issues      for select using (auth.uid() is not null);
create policy "Authenticated can create issues"  on issues      for insert with check (auth.uid() is not null);
create policy "Issue creator can update"         on issues      for update using (auth.uid() = created_by);
create policy "Issue creator can delete"         on issues      for delete using (auth.uid() = created_by);
create policy "Users can read all todos"         on todos       for select using (auth.uid() is not null);
create policy "Authenticated can create todos"   on todos       for insert with check (auth.uid() is not null);
create policy "Todo owner can update"            on todos       for update using (auth.uid() = owner_id);
create policy "Todo owner can delete"            on todos       for delete using (auth.uid() = owner_id);
create policy "Users can read meeting logs"      on meeting_logs for select using (auth.uid() is not null);
create policy "Authenticated can log meetings"   on meeting_logs for insert with check (auth.uid() is not null);
create policy "Authenticated can read vto"       on vto         for select using (auth.uid() is not null);
create policy "Authenticated can update vto"     on vto         for update using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Authenticated can read nodes"     on accountability_nodes for select using (auth.uid() is not null);
create policy "Authenticated can manage nodes"   on accountability_nodes for all
  using (auth.uid() is not null) with check (auth.uid() is not null);


-- ============================================
-- PART 3: TRIGGERS & FUNCTIONS
-- ============================================

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists set_rocks_updated_at       on rocks;
drop trigger if exists set_measurables_updated_at on measurables;
drop trigger if exists set_issues_updated_at      on issues;
drop trigger if exists set_profiles_updated_at    on profiles;
drop trigger if exists set_todos_updated_at       on todos;

create trigger set_rocks_updated_at       before update on rocks       for each row execute procedure set_updated_at();
create trigger set_measurables_updated_at before update on measurables for each row execute procedure set_updated_at();
create trigger set_issues_updated_at      before update on issues      for each row execute procedure set_updated_at();
create trigger set_profiles_updated_at   before update on profiles    for each row execute procedure set_updated_at();
create trigger set_todos_updated_at       before update on todos       for each row execute procedure set_updated_at();

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


-- ============================================
-- PART 4: INDEXES
-- ============================================

create index if not exists rocks_owner_idx        on rocks (owner_id);
create index if not exists measurables_owner_idx  on measurables (owner_id);
create index if not exists scores_measurable_idx  on scores (measurable_id, week_start);
create index if not exists issues_status_idx      on issues (status);
create index if not exists todos_owner_idx        on todos (owner_id);
create index if not exists todos_week_idx         on todos (week_created);
create index if not exists meeting_logs_date_idx  on meeting_logs (meeting_date);
create index if not exists nodes_parent_idx       on accountability_nodes (parent_id);


-- ============================================
-- PART 5: DATA IMPORTS
-- ============================================

-- ---------- V/TO ----------
update vto set
  core_values = '[
    "Personal Responsibility — Own it, No excuses only reasons",
    "Always Better — Every day, Every year",
    "Driven Purpose — What''s next!",
    "Works With Dignity and Respect — Golden Rule",
    "Good Neighbor"
  ]',
  core_focus_purpose = 'Develop a community environment where people can engage nature to experience its Creator.',
  core_focus_niche = 'Develop enjoyable experiences around a regenerative farm and golf club.',
  ten_year_target = 'Future Date: December 31, 2030
Revenue: Purpose for every acre',
  mktg_target_market = 'Families, community members, and guests seeking nature-based, wholesome experiences.',
  mktg_uniques = '[
    "Regenerative farm",
    "Community-driven experiences",
    "Faith-centered environment"
  ]',
  mktg_proven_process = 'Discover & Plan Your Escape: We help you find the perfect retreat and book your experience.

Immerse & Grow: We provide a hands-on, enriching experience that regenerates the land and renews your perspective.

Reflect & Connect: You''ll leave with a deeper connection to nature, a renewed sense of purpose, and an understanding of its Creator.

Partner & Propagate: We invite you to join our community and continue the journey of purpose-driven living.',
  mktg_guarantee = 'Memorable, values-driven experiences.',
  three_year_picture = 'Future Date: December 31, 2028
Revenue: $900,000
Profit: 10%

What does it look like?
• Food: farm fresh, primal food, pizza, outdoor kitchen, food trucks, themed nights
• Farm Events: educational, petting zoo, bee experience, chicken processing, kayaking, fishing
• Venue: Chapel, special needs facility, wine & chip, golf driving range
• 25 AirBnBs
• Orchard established',
  one_year_plan = 'Future Date: December 31, 2026
Revenue: $710,000
Profit: Break Even

Goals for the year:
1. Building remodel phase 2: railing repair, flooring, kitchen upgrades, ceiling repair, repaint (remove golden oak), lighting, audio, exterior coating
2. Golf Events: $60K
3. 150 Memberships
4. Launch initial food experiences (Pizza night, Taco Tuesday, outdoor kitchen setup)
5. Begin marketing rebrand
6. Establish baseline process documentation',
  updated_at = now()
where id = 1;


-- ---------- ROCKS ----------
delete from rocks;

insert into rocks (owner_id, owner_name, title, description, due_date, status) values

( (select id from auth.users order by created_at limit 1),
  'SC', 'Conestoga Wagon Infrastructure',
  'END GOAL: All the infrastructure, septic, water and electric for the wagon sites is built.',
  '2026-01-07', 'on_track' ),

( (select id from auth.users order by created_at limit 1),
  'SC', 'Farm Processes Written',
  'Work Order system: END GOAL — all the main processes for farm chores are written.',
  '2026-01-07', 'on_track' ),

( (select id from auth.users order by created_at limit 1),
  'JH', 'Food Phase 1',
  'Have a base menu established by the end of the quarter.',
  '2026-01-07', 'on_track' ),

( (select id from auth.users order by created_at limit 1),
  'DC', 'Marketing / Branding',
  'Identify ownership and access to the current Cherrywood Golf Course website, secure all logins and hosting information, and redesign and relaunch the website with updated branding, content, and functionality.',
  '2026-01-07', 'on_track' ),

( (select id from auth.users order by created_at limit 1),
  'BD', 'Revamp Scorecard',
  'Create a weekly scorecard for the golf course, farm, and lodging that includes 5–15 key measurables with clear ownership, at least two leading indicators per unit, and defines how each unit contributes to overall profitability.',
  '2026-01-07', 'on_track' ),

( (select id from auth.users order by created_at limit 1),
  'JH', 'Sell Memberships / Past Memberships',
  'Have at least 70% of target membership goals met.',
  '2026-01-07', 'on_track' ),

( (select id from auth.users order by created_at limit 1),
  'JH', 'Training for Employees',
  'First Aid, Customer Service, AED package ($1,500 — Dale approved ordering). Have everyone trained in first aid and have sales training done for the start of the new season.',
  '2026-01-07', 'on_track' ),

( (select id from auth.users order by created_at limit 1),
  'JH', 'Fall Plan for Farm Revenue',
  'Have an event calendar prepared for fall festivities in order to draw farm revenue this fall.',
  '2026-01-07', 'on_track' ),

( (select id from auth.users order by created_at limit 1),
  'DC', 'Food Phase 2',
  null, '2026-01-07', 'on_track' ),

( (select id from auth.users order by created_at limit 1),
  'SG', 'Fully Utilize Square',
  null, '2026-01-07', 'on_track' ),

( (select id from auth.users order by created_at limit 1),
  'DC', 'Marketing Plan Phase 2',
  null, '2026-01-07', 'on_track' ),

( (select id from auth.users order by created_at limit 1),
  'SC', 'Wagon Infrastructure Phase 2',
  null, '2026-01-07', 'on_track' );


-- ---------- ACCOUNTABILITY CHART ----------
delete from accountability_nodes;

with
  visionary as (
    insert into accountability_nodes (role_name, person_name, parent_id, sort_order)
    values ('Visionary', 'Dale Cooper', null, 1)
    returning id
  ),
  integrator as (
    insert into accountability_nodes (role_name, person_name, parent_id, sort_order)
    select 'Integrator', 'Brian Davis', id, 1 from visionary
    returning id
  ),
  dir_ops as (
    insert into accountability_nodes (role_name, person_name, parent_id, sort_order)
    select 'Director of Operations', 'Dale Cooper', id, 1 from integrator
    returning id
  ),
  dir_fin as (
    insert into accountability_nodes (role_name, person_name, parent_id, sort_order)
    select 'Director of Finance', 'Seth Golding', id, 2 from integrator
    returning id
  ),
  clubhouse_mgr as (
    insert into accountability_nodes (role_name, person_name, parent_id, sort_order)
    select 'Clubhouse Manager', 'Jessica Holland', id, 1 from dir_ops
    returning id
  ),
  grounds_mgr as (
    insert into accountability_nodes (role_name, person_name, parent_id, sort_order)
    select 'Building & Grounds Manager', 'Chris Bird', id, 2 from dir_ops
    returning id
  ),
  farm_ops_mgr as (
    insert into accountability_nodes (role_name, person_name, parent_id, sort_order)
    select 'Farm Operations Manager', 'Steve Cooper', id, 3 from dir_ops
    returning id
  ),
  sales_mktg as (
    insert into accountability_nodes (role_name, person_name, parent_id, sort_order)
    select 'Sales / Marketing', 'Jessica Holland', id, 4 from dir_ops
    returning id
  ),
  hr as (
    insert into accountability_nodes (role_name, person_name, parent_id, sort_order)
    select 'Human Resources', 'Seth Golding', id, 1 from dir_fin
    returning id
  ),
  ca1 as (
    insert into accountability_nodes (role_name, person_name, parent_id, sort_order)
    select 'Clubhouse Attendant', 'Guss', id, 1 from clubhouse_mgr
    returning id
  ),
  ca2 as (
    insert into accountability_nodes (role_name, person_name, parent_id, sort_order)
    select 'Clubhouse Attendant', 'Garret', id, 2 from clubhouse_mgr
    returning id
  ),
  ca3 as (
    insert into accountability_nodes (role_name, person_name, parent_id, sort_order)
    select 'Clubhouse Attendant', 'Jodi', id, 3 from clubhouse_mgr
    returning id
  ),
  tgt1 as (
    insert into accountability_nodes (role_name, person_name, parent_id, sort_order)
    select 'Turf & Grounds Technician', null, id, 1 from grounds_mgr
    returning id
  ),
  tgt2 as (
    insert into accountability_nodes (role_name, person_name, parent_id, sort_order)
    select 'Turf & Grounds Technician', null, id, 2 from grounds_mgr
    returning id
  ),
  tgt3 as (
    insert into accountability_nodes (role_name, person_name, parent_id, sort_order)
    select 'Turf & Grounds Technician', null, id, 3 from grounds_mgr
    returning id
  ),
  farmhand as (
    insert into accountability_nodes (role_name, person_name, parent_id, sort_order)
    select 'Farm Hand', 'Dalton', id, 1 from farm_ops_mgr
    returning id
  )
select 'Accountability chart: 16 nodes inserted.' as result;


-- ---------- SCORECARD MEASURABLES ----------
delete from scores;
delete from measurables;

insert into measurables (owner_id, metric_name, goal_value, goal_direction, sort_order, active)
select
  (select id from auth.users order by created_at limit 1),
  m.metric_name, m.goal_value, m.goal_direction, m.sort_order, true
from (values
  ('Corporate Memberships',        15,      'gte', 1),
  ('Memberships',                  150,     'gte', 2),
  ('Positive Reviews',             3,       'gte', 3),
  ('Rounds Played (Paid)',         100,     'gte', 4),
  ('Social Media Followers (new)', 5,       'gte', 5),
  ('Payroll %',                    30,      'lte', 6),
  ('Revenue / Farm',               100,     'gte', 7),
  ('Weekly Sales',                 5500,    'gte', 8),
  ('Egg / Layer Ratio %',          85,      'gte', 9),
  ('Egg Inventory',                1000,    'lte', 10),
  ('Eggs / Day',                   400,     'gte', 11),
  ('Eyesore List',                 5,       'lte', 12)
) as m(metric_name, goal_value, goal_direction, sort_order);


-- ---------- SCORECARD SCORES ----------

-- Corporate Memberships
insert into scores (measurable_id, week_start, value, entered_by)
select (select id from measurables where metric_name = 'Corporate Memberships'),
  t.w::date, t.v::numeric,
  (select id from auth.users order by created_at limit 1)
from (values
  ('2026-03-16', '0'), ('2026-03-09', '1'), ('2026-03-02', '1'),
  ('2026-02-23', '1'), ('2026-02-16', '0'), ('2026-02-09', '1'),
  ('2026-02-02', '2'), ('2026-01-26', '1'), ('2026-01-19', '1'),
  ('2026-01-12', '3')
) as t(w, v);

-- Memberships
insert into scores (measurable_id, week_start, value, entered_by)
select (select id from measurables where metric_name = 'Memberships'),
  t.w::date, t.v::numeric,
  (select id from auth.users order by created_at limit 1)
from (values
  ('2026-03-16', '0'), ('2026-03-09', '0'), ('2026-03-02', '0'),
  ('2026-02-23', '1'), ('2026-02-16', '5'), ('2026-02-09', '1'),
  ('2026-02-02', '0'), ('2026-01-26', '0'), ('2026-01-19', '0'),
  ('2026-01-12', '10'), ('2026-01-05', '8')
) as t(w, v);

-- Positive Reviews
insert into scores (measurable_id, week_start, value, entered_by)
select (select id from measurables where metric_name = 'Positive Reviews'),
  t.w::date, t.v::numeric,
  (select id from auth.users order by created_at limit 1)
from (values
  ('2026-03-16', '2'), ('2026-03-09', '1'), ('2026-03-02', '1'),
  ('2026-02-23', '3'), ('2026-02-16', '1'), ('2026-02-09', '3'),
  ('2026-02-02', '1'), ('2026-01-26', '0'), ('2026-01-19', '0'),
  ('2026-01-12', '3'), ('2026-01-05', '2'), ('2025-12-29', '0'),
  ('2025-12-22', '0')
) as t(w, v);

-- Rounds Played (Paid)
insert into scores (measurable_id, week_start, value, entered_by)
select (select id from measurables where metric_name = 'Rounds Played (Paid)'),
  t.w::date, t.v::numeric,
  (select id from auth.users order by created_at limit 1)
from (values
  ('2026-03-16', '34'), ('2026-03-09', '37'), ('2026-03-02', '37'),
  ('2026-02-23', '50'), ('2026-02-16', '35'), ('2026-02-09', '11'),
  ('2026-02-02', '0'),  ('2026-01-26', '0'),  ('2026-01-19', '7'),
  ('2026-01-12', '8'),  ('2026-01-05', '62'), ('2025-12-29', '18'),
  ('2025-12-22', '73')
) as t(w, v);

-- Social Media Followers (new)
insert into scores (measurable_id, week_start, value, entered_by)
select (select id from measurables where metric_name = 'Social Media Followers (new)'),
  t.w::date, t.v::numeric,
  (select id from auth.users order by created_at limit 1)
from (values
  ('2026-03-16', '6'), ('2026-03-09', '3'), ('2026-03-02', '3'),
  ('2026-02-23', '3'), ('2026-02-16', '5'), ('2026-02-09', '7'),
  ('2026-02-02', '4'), ('2026-01-26', '0'), ('2026-01-19', '4'),
  ('2026-01-12', '5'), ('2026-01-05', '2'), ('2025-12-29', '5'),
  ('2025-12-22', '6')
) as t(w, v);

-- Payroll %
insert into scores (measurable_id, week_start, value, entered_by)
select (select id from measurables where metric_name = 'Payroll %'),
  t.w::date, t.v::numeric,
  (select id from auth.users order by created_at limit 1)
from (values
  ('2026-03-16', '54'),    ('2026-03-09', '54'),    ('2026-02-23', '54.5'),
  ('2026-02-16', '120.51'),('2026-02-09', '120.51'),('2026-02-02', '287.45'),
  ('2026-01-26', '287.45'),('2026-01-19', '59.6'),  ('2026-01-12', '59.6'),
  ('2026-01-05', '53.8'),  ('2025-12-29', '53.8')
) as t(w, v);

-- Revenue / Farm
insert into scores (measurable_id, week_start, value, entered_by)
select (select id from measurables where metric_name = 'Revenue / Farm'),
  t.w::date, t.v::numeric,
  (select id from auth.users order by created_at limit 1)
from (values
  ('2026-03-16', '236'), ('2026-03-09', '120'), ('2026-03-02', '100'),
  ('2026-02-23', '100'), ('2026-02-16', '0'),   ('2026-02-09', '1600')
) as t(w, v);

-- Weekly Sales
insert into scores (measurable_id, week_start, value, entered_by)
select (select id from measurables where metric_name = 'Weekly Sales'),
  t.w::date, t.v::numeric,
  (select id from auth.users order by created_at limit 1)
from (values
  ('2026-03-09', '7962'),    ('2026-03-02', '7962'),   ('2026-02-16', '9544'),
  ('2026-02-09', '4945'),    ('2026-02-02', '0'),       ('2026-01-26', '3400'),
  ('2026-01-19', '144'),     ('2026-01-12', '2068'),    ('2026-01-05', '10854.59'),
  ('2025-12-29', '574'),     ('2025-12-22', '8262')
) as t(w, v);

-- Egg / Layer Ratio %
insert into scores (measurable_id, week_start, value, entered_by)
select (select id from measurables where metric_name = 'Egg / Layer Ratio %'),
  t.w::date, t.v::numeric,
  (select id from auth.users order by created_at limit 1)
from (values
  ('2026-03-16', '70'), ('2026-03-09', '72'), ('2026-03-02', '72'),
  ('2026-02-23', '69'), ('2026-02-16', '52')
) as t(w, v);

-- Egg Inventory
insert into scores (measurable_id, week_start, value, entered_by)
select (select id from measurables where metric_name = 'Egg Inventory'),
  t.w::date, t.v::numeric,
  (select id from auth.users order by created_at limit 1)
from (values
  ('2026-03-16', '1320')
) as t(w, v);

-- Eggs / Day
insert into scores (measurable_id, week_start, value, entered_by)
select (select id from measurables where metric_name = 'Eggs / Day'),
  t.w::date, t.v::numeric,
  (select id from auth.users order by created_at limit 1)
from (values
  ('2026-03-16', '140'), ('2026-03-09', '144'), ('2026-03-02', '144'),
  ('2026-02-23', '138'), ('2026-02-16', '105'), ('2026-02-09', '91'),
  ('2026-02-02', '89')
) as t(w, v);

-- Eyesore List
insert into scores (measurable_id, week_start, value, entered_by)
select (select id from measurables where metric_name = 'Eyesore List'),
  t.w::date, t.v::numeric,
  (select id from auth.users order by created_at limit 1)
from (values
  ('2026-03-09', '3'), ('2026-03-02', '3'), ('2026-02-23', '0'),
  ('2026-02-16', '5'), ('2026-02-09', '4'), ('2026-02-02', '5'),
  ('2026-01-26', '1'), ('2026-01-19', '0')
) as t(w, v);


-- ---------- ISSUES ----------
delete from issues;

insert into issues (created_by, title, description, priority, status) values

( (select id from auth.users order by created_at limit 1),
  'QR Codes on golf carts',
  'LEA-163: Advertisement AND payment system for farm products on golf carts.',
  'normal', 'open' ),

( (select id from auth.users order by created_at limit 1),
  'Employee members under corporate membership having free passes',
  'LEA-282 — Owner: JH',
  'normal', 'open' ),

( (select id from auth.users order by created_at limit 1),
  'Entry Fee for Azalea Tournament',
  'LEA-286 — $120–$130/Team? Better prizes, possibly better food.',
  'normal', 'open' ),

( (select id from auth.users order by created_at limit 1),
  'From Jody: 30 spam calls per day',
  'LEA-283 — Owner: JC',
  'normal', 'open' ),

( (select id from auth.users order by created_at limit 1),
  'Hours incorrect on website',
  'LEA-284 — Correct hours: Mon–Fri 9am–5pm, Sat–Sun 8am–5pm.',
  'high', 'open' ),

( (select id from auth.users order by created_at limit 1),
  'Scheduling on Paycom',
  'LEA-287 — Owner: JH',
  'normal', 'open' );


-- ---------- TO-DOS ----------
delete from todos;

insert into todos (owner_id, owner_name, title, due_date, done, week_created) values

( (select id from auth.users order by created_at limit 1),
  'JC', 'Meet with Greg about corporate membership — collect money',
  '2026-01-22', true, '2026-01-19' ),

( (select id from auth.users order by created_at limit 1),
  'SC', 'Revenue/Farm — backfill number (Type: WEEKLY, Target: >= $100)',
  '2026-03-05', true, '2026-03-02' ),

( (select id from auth.users order by created_at limit 1),
  'JC', 'Form for egg clients (flyer/Google form, distribution, how many, price?)',
  '2026-03-05', true, '2026-03-02' ),

( (select id from auth.users order by created_at limit 1),
  'JC', 'Phone bill — register account and share with Seth',
  '2026-03-05', false, '2026-03-02' ),

( (select id from auth.users order by created_at limit 1),
  'BD', 'Talk to Seth about Payroll',
  '2026-03-26', false, '2026-03-16' ),

( (select id from auth.users order by created_at limit 1),
  'JC', 'Collect membership money from Golden Rule & Covenant Care',
  '2026-03-11', false, '2026-03-09' ),

( (select id from auth.users order by created_at limit 1),
  'JH', 'Collect membership money from Craig Woods',
  '2026-03-19', false, '2026-03-16' ),

( (select id from auth.users order by created_at limit 1),
  'DC', 'Follow up with Kelly — Arnold Farmers Market (follow up with mom)',
  '2026-03-19', false, '2026-03-16' ),

( (select id from auth.users order by created_at limit 1),
  'SC', 'Follow up with Dwight McMinn',
  '2026-03-19', true, '2026-03-16' ),

( (select id from auth.users order by created_at limit 1),
  'JC', 'Send application',
  '2026-03-19', false, '2026-03-16' ),

( (select id from auth.users order by created_at limit 1),
  'BD', 'Revenue per 100 rounds played — scorecard analysis',
  '2026-03-19', true, '2026-03-16' ),

( (select id from auth.users order by created_at limit 1),
  'JC', 'Website upgrades (mobile friendly, hide nonfunctional elements, link to Google profile)',
  '2026-03-19', true, '2026-03-16' ),

( (select id from auth.users order by created_at limit 1),
  'BD', 'Look at website — "under construction" message',
  '2026-03-19', true, '2026-03-16' ),

( (select id from auth.users order by created_at limit 1),
  'JC', 'State of Cherrywood — make sure everyone knows',
  '2026-03-19', true, '2026-03-16' ),

( (select id from auth.users order by created_at limit 1),
  'JC', 'Schedule townhall meeting — all invited, after remodel',
  '2026-03-19', false, '2026-03-16' ),

( (select id from auth.users order by created_at limit 1),
  'JC', 'Ask Jess about the Azalea Tournament',
  '2026-03-19', true, '2026-03-16' ),

( (select id from auth.users order by created_at limit 1),
  'DC', '90 degree rule signs — talk to Chris about removing them (cart path only at sign-in)',
  '2026-03-19', true, '2026-03-16' ),

( (select id from auth.users order by created_at limit 1),
  'BD', 'Talk to Jessica about cart path only rules (communicated at sign-in)',
  '2026-03-19', true, '2026-03-16' ),

( (select id from auth.users order by created_at limit 1),
  'SC', 'Find out when the Madison Farmer''s Market takes place',
  '2026-03-19', true, '2026-03-16' ),

( (select id from auth.users order by created_at limit 1),
  'SC', 'Pre-sell 4 steers',
  '2026-03-19', false, '2026-03-16' ),

( (select id from auth.users order by created_at limit 1),
  'BD', 'Budget for course sponsored events (entry fees, prize pool, F&B, skins game, mulligans)',
  '2026-03-19', true, '2026-03-16' ),

( (select id from auth.users order by created_at limit 1),
  'DC', 'Organize purchasing for Jess — get her credit card info',
  '2026-03-19', false, '2026-03-16' );


select 'Cherrywood portal setup complete.' as result;
