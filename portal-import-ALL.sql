-- ============================================
-- Cherrywood Team Portal — Phase 3 Schema
-- Run in Supabase SQL Editor after portal-phase2.sql
-- ============================================

-- V/TO (Vision/Traction Organizer) — singleton document
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

alter table vto enable row level security;
drop policy if exists "Authenticated can read vto"   on vto;
drop policy if exists "Authenticated can update vto" on vto;
create policy "Authenticated can read vto"   on vto for select using (auth.uid() is not null);
create policy "Authenticated can update vto" on vto for update using (auth.uid() is not null) with check (auth.uid() is not null);

-- Accountability chart nodes (self-referencing tree)
create table if not exists accountability_nodes (
  id uuid default gen_random_uuid() primary key,
  role_name text not null,
  person_name text,
  parent_id uuid references accountability_nodes(id) on delete set null,
  sort_order int not null default 0,
  created_at timestamptz default now()
);

alter table accountability_nodes enable row level security;
drop policy if exists "Authenticated can read nodes"   on accountability_nodes;
drop policy if exists "Authenticated can manage nodes" on accountability_nodes;
create policy "Authenticated can read nodes"   on accountability_nodes for select using (auth.uid() is not null);
create policy "Authenticated can manage nodes" on accountability_nodes for all
  using (auth.uid() is not null) with check (auth.uid() is not null);

create index if not exists nodes_parent_idx on accountability_nodes (parent_id);
-- ============================================
-- Cherrywood Portal — Full Data Import
-- From V/TO PDF dated 3/20/2026
--
-- HOW TO RUN:
--   Supabase → SQL Editor → New query → paste → Run
--   Run portal-phase3.sql first if you haven't already.
-- ============================================


-- ============================================
-- 1. V/TO
-- ============================================

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


-- ============================================
-- 2. ROCKS (12 for Q1 2026)
-- Uses the first authenticated user as owner_id.
-- Owner names are initials from the PDF.
-- Update owner_name values to full names as needed.
-- ============================================

-- Clear existing rocks if re-running this import
-- (comment this line out if you want to keep existing rocks)
-- delete from rocks;

insert into rocks (owner_id, owner_name, title, description, due_date, status)
values

-- 1
( (select id from auth.users order by created_at limit 1),
  'SC',
  'Conestoga Wagon Infrastructure',
  'END GOAL: All the infrastructure, septic, water and electric for the wagon sites is built.',
  '2026-01-07',
  'on_track' ),

-- 2
( (select id from auth.users order by created_at limit 1),
  'SC',
  'Farm Processes Written',
  'Work Order system: END GOAL — all the main processes for farm chores are written.',
  '2026-01-07',
  'on_track' ),

-- 3
( (select id from auth.users order by created_at limit 1),
  'JH',
  'Food Phase 1',
  'Have a base menu established by the end of the quarter.',
  '2026-01-07',
  'on_track' ),

-- 4
( (select id from auth.users order by created_at limit 1),
  'DC',
  'Marketing / Branding',
  'Identify ownership and access to the current Cherrywood Golf Course website, secure all logins and hosting information, and redesign and relaunch the website with updated branding, content, and functionality.',
  '2026-01-07',
  'on_track' ),

-- 5
( (select id from auth.users order by created_at limit 1),
  'BD',
  'Revamp Scorecard',
  'Create a weekly scorecard for the golf course, farm, and lodging that includes 5–15 key measurables with clear ownership, at least two leading indicators per unit, and defines how each unit contributes to overall profitability.',
  '2026-01-07',
  'on_track' ),

-- 6
( (select id from auth.users order by created_at limit 1),
  'JH',
  'Sell Memberships / Past Memberships',
  'Have at least 70% of target membership goals met.',
  '2026-01-07',
  'on_track' ),

-- 7
( (select id from auth.users order by created_at limit 1),
  'JH',
  'Training for Employees',
  'First Aid, Customer Service, AED package ($1,500 — Dale approved ordering). Have everyone trained in first aid and have sales training done for the start of the new season.',
  '2026-01-07',
  'on_track' ),

-- 8
( (select id from auth.users order by created_at limit 1),
  'JH',
  'Fall Plan for Farm Revenue',
  'Have an event calendar prepared for fall festivities in order to draw farm revenue this fall.',
  '2026-01-07',
  'on_track' ),

-- 9
( (select id from auth.users order by created_at limit 1),
  'DC',
  'Food Phase 2',
  null,
  '2026-01-07',
  'on_track' ),

-- 10
( (select id from auth.users order by created_at limit 1),
  'SG',
  'Fully Utilize Square',
  null,
  '2026-01-07',
  'on_track' ),

-- 11
( (select id from auth.users order by created_at limit 1),
  'DC',
  'Marketing Plan Phase 2',
  null,
  '2026-01-07',
  'on_track' ),

-- 12
( (select id from auth.users order by created_at limit 1),
  'SC',
  'Wagon Infrastructure Phase 2',
  null,
  '2026-01-07',
  'on_track' );


-- ============================================
-- 3. ISSUES
-- ============================================

insert into issues (created_by, title, description, priority, status)
values
( (select id from auth.users order by created_at limit 1),
  'QR Codes on golf carts',
  'LEA-163: Advertisement AND payment system for farm products on golf carts.',
  'normal',
  'open' );
-- ============================================
-- Cherrywood Accountability Chart Import
-- From PDF dated 3/20/2026
--
-- HOW TO RUN:
--   Supabase → SQL Editor → New query → paste → Run
-- ============================================

-- Clear existing nodes if re-running
delete from accountability_nodes;

-- Insert the full tree using CTEs so parent IDs chain correctly
with
  -- LEVEL 0: Visionary (root)
  visionary as (
    insert into accountability_nodes (role_name, person_name, parent_id, sort_order)
    values ('Visionary', 'Dale Cooper', null, 1)
    returning id
  ),

  -- LEVEL 1: Integrator
  integrator as (
    insert into accountability_nodes (role_name, person_name, parent_id, sort_order)
    select 'Integrator', 'Brian Davis', id, 1 from visionary
    returning id
  ),

  -- LEVEL 2: Director of Operations + Director of Finance
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

  -- LEVEL 3: Under Director of Operations
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

  -- LEVEL 3: Under Director of Finance
  hr as (
    insert into accountability_nodes (role_name, person_name, parent_id, sort_order)
    select 'Human Resources', 'Seth Golding', id, 1 from dir_fin
    returning id
  ),

  -- LEVEL 4: Under Clubhouse Manager
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

  -- LEVEL 4: Under Building & Grounds Manager (3 open seats)
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

  -- LEVEL 4: Under Farm Operations Manager
  farmhand as (
    insert into accountability_nodes (role_name, person_name, parent_id, sort_order)
    select 'Farm Hand', 'Dalton', id, 1 from farm_ops_mgr
    returning id
  )

select 'Accountability chart imported: 16 nodes.' as result;
-- ============================================
-- Cherrywood Scorecard Import
-- From PDF dated 3/20/2026 — Leadership Team
--
-- HOW TO RUN:
--   Supabase → SQL Editor → New query → paste → Run
-- ============================================

-- Clear existing scorecard data if re-running
delete from scores;
delete from measurables;

-- ============================================
-- 1. INSERT MEASURABLES (12 metrics)
-- ============================================

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


-- ============================================
-- 2. INSERT HISTORICAL SCORES
-- ============================================

-- Corporate Memberships
insert into scores (measurable_id, week_start, value, entered_by)
select (select id from measurables where metric_name = 'Corporate Memberships'),
  t.w::date, t.v,
  (select id from auth.users order by created_at limit 1)
from (values
  ('2026-03-16', 0),
  ('2026-03-09', 1),
  ('2026-03-02', 1),
  ('2026-02-23', 1),
  ('2026-02-16', 0),
  ('2026-02-09', 1),
  ('2026-02-02', 2),
  ('2026-01-26', 1),
  ('2026-01-19', 1),
  ('2026-01-12', 3)
) as t(w, v);

-- Memberships
insert into scores (measurable_id, week_start, value, entered_by)
select (select id from measurables where metric_name = 'Memberships'),
  t.w::date, t.v,
  (select id from auth.users order by created_at limit 1)
from (values
  ('2026-03-16', 0),
  ('2026-03-09', 0),
  ('2026-03-02', 0),
  ('2026-02-23', 1),
  ('2026-02-16', 5),
  ('2026-02-09', 1),
  ('2026-02-02', 0),
  ('2026-01-26', 0),
  ('2026-01-19', 0),
  ('2026-01-12', 10),
  ('2026-01-05', 8)
) as t(w, v);

-- Positive Reviews
insert into scores (measurable_id, week_start, value, entered_by)
select (select id from measurables where metric_name = 'Positive Reviews'),
  t.w::date, t.v,
  (select id from auth.users order by created_at limit 1)
from (values
  ('2026-03-16', 2),
  ('2026-03-09', 1),
  ('2026-03-02', 1),
  ('2026-02-23', 3),
  ('2026-02-16', 1),
  ('2026-02-09', 3),
  ('2026-02-02', 1),
  ('2026-01-26', 0),
  ('2026-01-19', 0),
  ('2026-01-12', 3),
  ('2026-01-05', 2),
  ('2025-12-29', 0),
  ('2025-12-22', 0)
) as t(w, v);

-- Rounds Played (Paid)
insert into scores (measurable_id, week_start, value, entered_by)
select (select id from measurables where metric_name = 'Rounds Played (Paid)'),
  t.w::date, t.v,
  (select id from auth.users order by created_at limit 1)
from (values
  ('2026-03-16', 34),
  ('2026-03-09', 37),
  ('2026-03-02', 37),
  ('2026-02-23', 50),
  ('2026-02-16', 35),
  ('2026-02-09', 11),
  ('2026-02-02', 0),
  ('2026-01-26', 0),
  ('2026-01-19', 7),
  ('2026-01-12', 8),
  ('2026-01-05', 62),
  ('2025-12-29', 18),
  ('2025-12-22', 73)
) as t(w, v);

-- Social Media Followers (new per week)
insert into scores (measurable_id, week_start, value, entered_by)
select (select id from measurables where metric_name = 'Social Media Followers (new)'),
  t.w::date, t.v,
  (select id from auth.users order by created_at limit 1)
from (values
  ('2026-03-16', 6),
  ('2026-03-09', 3),
  ('2026-03-02', 3),
  ('2026-02-23', 3),
  ('2026-02-16', 5),
  ('2026-02-09', 7),
  ('2026-02-02', 4),
  ('2026-01-26', 0),
  ('2026-01-19', 4),
  ('2026-01-12', 5),
  ('2026-01-05', 2),
  ('2025-12-29', 5),
  ('2025-12-22', 6)
) as t(w, v);

-- Payroll % (goal <= 30%)
insert into scores (measurable_id, week_start, value, entered_by)
select (select id from measurables where metric_name = 'Payroll %'),
  t.w::date, t.v,
  (select id from auth.users order by created_at limit 1)
from (values
  ('2026-03-16', 54),
  ('2026-03-09', 54),
  ('2026-02-23', 54.5),
  ('2026-02-16', 120.51),
  ('2026-02-09', 120.51),
  ('2026-02-02', 287.45),
  ('2026-01-26', 287.45),
  ('2026-01-19', 59.6),
  ('2026-01-12', 59.6),
  ('2026-01-05', 53.8),
  ('2025-12-29', 53.8)
) as t(w, v);

-- Revenue / Farm
insert into scores (measurable_id, week_start, value, entered_by)
select (select id from measurables where metric_name = 'Revenue / Farm'),
  t.w::date, t.v,
  (select id from auth.users order by created_at limit 1)
from (values
  ('2026-03-16', 236),
  ('2026-03-09', 120),
  ('2026-03-02', 100),
  ('2026-02-23', 100),
  ('2026-02-16', 0),
  ('2026-02-09', 1600)
) as t(w, v);

-- Weekly Sales
insert into scores (measurable_id, week_start, value, entered_by)
select (select id from measurables where metric_name = 'Weekly Sales'),
  t.w::date, t.v,
  (select id from auth.users order by created_at limit 1)
from (values
  ('2026-03-09', 7962),
  ('2026-03-02', 7962),
  ('2026-02-16', 9544),
  ('2026-02-09', 4945),
  ('2026-02-02', 0),
  ('2026-01-26', 3400),
  ('2026-01-19', 144),
  ('2026-01-12', 2068),
  ('2026-01-05', 10854.59),
  ('2025-12-29', 574),
  ('2025-12-22', 8262)
) as t(w, v);

-- Egg / Layer Ratio %
insert into scores (measurable_id, week_start, value, entered_by)
select (select id from measurables where metric_name = 'Egg / Layer Ratio %'),
  t.w::date, t.v,
  (select id from auth.users order by created_at limit 1)
from (values
  ('2026-03-16', 70),
  ('2026-03-09', 72),
  ('2026-03-02', 72),
  ('2026-02-23', 69),
  ('2026-02-16', 52)
) as t(w, v);

-- Egg Inventory
insert into scores (measurable_id, week_start, value, entered_by)
select (select id from measurables where metric_name = 'Egg Inventory'),
  t.w::date, t.v,
  (select id from auth.users order by created_at limit 1)
from (values
  ('2026-03-16', 1320)
) as t(w, v);

-- Eggs / Day
insert into scores (measurable_id, week_start, value, entered_by)
select (select id from measurables where metric_name = 'Eggs / Day'),
  t.w::date, t.v,
  (select id from auth.users order by created_at limit 1)
from (values
  ('2026-03-16', 140),
  ('2026-03-09', 144),
  ('2026-03-02', 144),
  ('2026-02-23', 138),
  ('2026-02-16', 105),
  ('2026-02-09', 91),
  ('2026-02-02', 89)
) as t(w, v);

-- Eyesore List
insert into scores (measurable_id, week_start, value, entered_by)
select (select id from measurables where metric_name = 'Eyesore List'),
  t.w::date, t.v,
  (select id from auth.users order by created_at limit 1)
from (values
  ('2026-03-09', 3),
  ('2026-03-02', 3),
  ('2026-02-23', 0),
  ('2026-02-16', 5),
  ('2026-02-09', 4),
  ('2026-02-02', 5),
  ('2026-01-26', 1),
  ('2026-01-19', 0)
) as t(w, v);
-- ============================================
-- Cherrywood Issues Import
-- Short-Term Issues — Leadership Team
-- From PDF dated 3/20/2026
--
-- HOW TO RUN:
--   Supabase → SQL Editor → New query → paste → Run
-- NOTE: Run portal-full-import.sql first (it adds LEA-163).
--       This file adds the remaining 5 issues.
-- ============================================

insert into issues (created_by, title, description, priority, status)
values

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
-- ============================================
-- Cherrywood To-Dos Import
-- Leadership Team — 22 To-Dos
-- From PDF dated 3/20/2026
--
-- HOW TO RUN:
--   Supabase → SQL Editor → New query → paste → Run
-- ============================================

-- Clear existing todos if re-running
delete from todos;

insert into todos (owner_id, owner_name, title, due_date, done, week_created)
values

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
