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
