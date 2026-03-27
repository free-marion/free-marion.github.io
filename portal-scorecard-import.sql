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
