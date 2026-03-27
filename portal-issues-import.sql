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
