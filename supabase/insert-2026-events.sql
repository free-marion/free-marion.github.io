-- 2026 placeholder events — paste into Supabase SQL editor to push to production
-- All events start as 'draft' (show on calendar as "Coming Soon", no registration form)
-- To go live: UPDATE tournaments SET status = 'open' WHERE id = '<id>';

insert into tournaments (id, name, date, time, type, max_slots, status, description) values
  ('ee000001-0000-0000-0000-000000000000', 'Abrigo Baby Shower',                       '2026-05-16', null,    'individual', 0, 'draft', null),
  ('ee000002-0000-0000-0000-000000000000', 'Mays Private Event',                       '2026-05-30', null,    'individual', 0, 'draft', null),
  ('ee000003-0000-0000-0000-000000000000', 'Mangold Private Event',                    '2026-06-06', null,    'individual', 0, 'draft', null),
  ('ee000004-0000-0000-0000-000000000000', 'Hale Graduation Party',                    '2026-06-07', '13:00', 'individual', 0, 'draft', '1:00–5:00 PM'),
  ('ee000005-0000-0000-0000-000000000000', 'Chamber of Commerce Tournament',           '2026-06-11', null,    'team',       0, 'draft', null),
  ('ee000006-0000-0000-0000-000000000000', 'FHS Football Tournament',                  '2026-06-13', null,    'team',       0, 'draft', 'Fredericktown High School'),
  ('ee000007-0000-0000-0000-000000000000', 'Sikes Private Event',                      '2026-06-14', null,    'individual', 0, 'draft', null),
  ('ee000008-0000-0000-0000-000000000000', 'Junior Leadbelt Tournament',               '2026-06-15', null,    'individual', 0, 'draft', null),
  ('ee000009-0000-0000-0000-000000000000', 'Chris Berry – Class of ''91',              '2026-06-20', '14:00', 'individual', 0, 'draft', '2:00–5:00 PM'),
  ('ee00000a-0000-0000-0000-000000000000', 'Jada Jordan Baby Shower',                  '2026-06-27', '13:00', 'individual', 0, 'draft', '1:00–3:00 PM'),
  ('ee00000b-0000-0000-0000-000000000000', 'Glow in the Dark Tournament',              '2026-07-11', null,    'team',       0, 'draft', null),
  ('ee00000c-0000-0000-0000-000000000000', 'Safe Slide Restoration Quarterly Meeting', '2026-07-13', null,    'individual', 0, 'draft', null),
  ('ee00000d-0000-0000-0000-000000000000', 'Glow in the Dark Tournament',              '2026-07-25', null,    'team',       0, 'draft', null),
  ('ee00000e-0000-0000-0000-000000000000', 'Glow in the Dark Tournament',              '2026-08-08', null,    'team',       0, 'draft', null),
  ('ee00000f-0000-0000-0000-000000000000', 'Glow in the Dark Tournament',              '2026-08-22', null,    'team',       0, 'draft', null),
  ('ee000010-0000-0000-0000-000000000000', 'Glow in the Dark Tournament',              '2026-09-06', null,    'team',       0, 'draft', null),
  ('ee000011-0000-0000-0000-000000000000', 'FSP Meet & Greet',                         '2026-09-16', null,    'individual', 0, 'draft', null),
  ('ee000012-0000-0000-0000-000000000000', 'FSP Tournament',                           '2026-09-17', null,    'team',       0, 'draft', null),
  ('ee000013-0000-0000-0000-000000000000', 'Kylie Sutton Rehearsal Dinner',            '2026-10-09', '19:00', 'individual', 0, 'draft', '7:00–9:00 PM'),
  ('ee000014-0000-0000-0000-000000000000', 'Monica Private Event',                     '2026-12-16', null,    'individual', 0, 'draft', null)
on conflict (id) do nothing;
