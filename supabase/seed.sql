-- =============================================================
-- Cherrywood Test Seed Data
-- Applied automatically after migrations via: supabase db reset
-- Contains realistic test data only — not production data.
-- =============================================================

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
    (current_date - interval '10 days')::date,
    '10:00 AM',
    'individual', null, 40, 'Stroke Play', 60.00, 'cancelled',
    'Cancelled due to weather.'
  );

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
