-- =============================================================
-- Cherrywood Test Seed Data
-- Applied automatically after migrations via: supabase db reset
-- Contains realistic test data only — not production data.
-- =============================================================

-- ============================================================
-- Portal auth user (local dev only — password: Arabia)
-- Production: create via Supabase dashboard Authentication > Users
-- ============================================================

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, recovery_token,
  email_change_token_new, email_change
) values (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000099',
  'authenticated', 'authenticated',
  'portal@cherrywoodgolf.com',
  crypt('Arabia', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}', '{}',
  now(), now(), '', '', '', ''
) on conflict (id) do nothing;

insert into auth.identities (
  id, user_id, provider_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000099',
  '00000000-0000-0000-0000-000000000099',
  'portal@cherrywoodgolf.com',
  format('{"sub":"%s","email":"%s"}',
    '00000000-0000-0000-0000-000000000099'::text,
    'portal@cherrywoodgolf.com')::jsonb,
  'email',
  now(), now(), now()
) on conflict (provider_id, provider) do nothing;

-- Course status (open by default)
update course_status set is_open = true, closed_on = null where id = 1;

-- Tournaments
insert into tournaments (id, name, date, time, type, team_size, max_slots, format, entry_fee, status, notes) values
  (
    '11111111-1111-1111-1111-111111111111',
    'Azalea Open',
    (current_date + interval '30 days')::date,
    '9:00 AM',
    'team', 4, 32, 'Scramble', 120.00, 'open',
    'Annual spring scramble. Prizes for 1st, 2nd, and 3rd place.'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Member-Guest Classic',
    (current_date + interval '60 days')::date,
    '8:00 AM',
    'team', 2, 20, 'Best Ball', 80.00, 'open',
    null
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'Fall Invitational',
    (current_date + interval '45 days')::date,
    '10:00 AM',
    'individual', null, 40, 'Stroke Play', 60.00, 'cancelled',
    'Cancelled due to weather.'
  );

-- 2026 placeholder events
insert into tournaments (id, name, date, time, type, max_slots, status, description) values
  ('ee000001-0000-0000-0000-000000000000', 'Abrigo Baby Shower',                    '2026-05-16', null,    'individual', 0, 'draft', null),
  ('ee000002-0000-0000-0000-000000000000', 'Mays Private Event',                    '2026-05-30', null,    'individual', 0, 'draft', null),
  ('ee000003-0000-0000-0000-000000000000', 'Mangold Private Event',                 '2026-06-06', null,    'individual', 0, 'draft', null),
  ('ee000004-0000-0000-0000-000000000000', 'Hale Graduation Party',                 '2026-06-07', '13:00', 'individual', 0, 'draft', '1:00–5:00 PM'),
  ('ee000005-0000-0000-0000-000000000000', 'Chamber of Commerce Tournament',        '2026-06-11', null,    'team',       0, 'draft', null),
  ('ee000006-0000-0000-0000-000000000000', 'FHS Football Tournament',               '2026-06-13', null,    'team',       0, 'draft', 'Fredericktown High School'),
  ('ee000007-0000-0000-0000-000000000000', 'Sikes Private Event',                   '2026-06-14', null,    'individual', 0, 'draft', null),
  ('ee000008-0000-0000-0000-000000000000', 'Junior Leadbelt Tournament',            '2026-06-15', null,    'individual', 0, 'draft', null),
  ('ee000009-0000-0000-0000-000000000000', 'Chris Berry – Class of ''91',           '2026-06-20', '14:00', 'individual', 0, 'draft', '2:00–5:00 PM'),
  ('ee00000a-0000-0000-0000-000000000000', 'Jada Jordan Baby Shower',               '2026-06-27', '13:00', 'individual', 0, 'draft', '1:00–3:00 PM'),
  ('ee00000b-0000-0000-0000-000000000000', 'Glow in the Dark Tournament',           '2026-07-11', null,    'team',       0, 'draft', null),
  ('ee00000c-0000-0000-0000-000000000000', 'Safe Slide Restoration Quarterly Meeting', '2026-07-13', null, 'individual', 0, 'draft', null),
  ('ee00000d-0000-0000-0000-000000000000', 'Glow in the Dark Tournament',           '2026-07-25', null,    'team',       0, 'draft', null),
  ('ee00000e-0000-0000-0000-000000000000', 'Glow in the Dark Tournament',           '2026-08-08', null,    'team',       0, 'draft', null),
  ('ee00000f-0000-0000-0000-000000000000', 'Glow in the Dark Tournament',           '2026-08-22', null,    'team',       0, 'draft', null),
  ('ee000010-0000-0000-0000-000000000000', 'Glow in the Dark Tournament',           '2026-09-06', null,    'team',       0, 'draft', null),
  ('ee000011-0000-0000-0000-000000000000', 'FSP Meet & Greet',                      '2026-09-16', null,    'individual', 0, 'draft', null),
  ('ee000012-0000-0000-0000-000000000000', 'FSP Tournament',                        '2026-09-17', null,    'team',       0, 'draft', null),
  ('ee000013-0000-0000-0000-000000000000', 'Kylie Sutton Rehearsal Dinner',         '2026-10-09', '19:00', 'individual', 0, 'draft', '7:00–9:00 PM'),
  ('ee000014-0000-0000-0000-000000000000', 'Monica Private Event',                  '2026-12-16', null,    'individual', 0, 'draft', null);

-- Tournament registrations (for Azalea Open)
insert into tournament_registrations (tournament_id, team_name, captain_name, phone, cart, status) values
  ('11111111-1111-1111-1111-111111111111', 'Team Eagle',  'John Smith',   '555-0101', true,  'confirmed'),
  ('11111111-1111-1111-1111-111111111111', 'Team Birdie', 'Mary Johnson',  '555-0102', false, 'confirmed'),
  ('11111111-1111-1111-1111-111111111111', 'Team Par',    'Robert Davis',  '555-0103', true,  'confirmed'),
  ('11111111-1111-1111-1111-111111111111', 'Team Bogey',  'Susan Wilson',  '555-0104', true,  'cancelled');

-- Egg orders
insert into egg_orders (name, contact, dozens, pickup_date, notes, status) values
  ('Alice Brown',   '555-1001', 2, (current_date + interval '3 days')::date,  null,                   'pending'),
  ('Bob Carter',    '555-1002', 1, (current_date + interval '7 days')::date,  'Please call ahead.',   'pending'),
  ('Carol Davis',   '555-1003', 4, (current_date - interval '2 days')::date,  null,                   'complete'),
  ('Dave Edwards',  '555-1004', 1, (current_date + interval '1 day')::date,   'Leave at front door.', 'pending');
