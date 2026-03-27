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
