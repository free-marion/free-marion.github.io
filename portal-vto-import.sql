-- ============================================
-- Cherrywood V/TO Import — from PDF 3/20/2026
-- Run in Supabase SQL Editor
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
