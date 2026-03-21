-- ============================================
-- Portal Roles Setup
-- Run in Supabase SQL Editor
-- ============================================

-- Make sure the role column exists with a default of 'viewer'
alter table profiles add column if not exists role text not null default 'viewer';

-- Set your account as admin
update profiles set role = 'admin'
where id = (select id from auth.users where email = 'joel.cooper@safeslides.com');

-- ============================================
-- To add users in the future:
--
-- New staff member:
--   update profiles set role = 'staff'
--   where id = (select id from auth.users where email = 'email@example.com');
--
-- New viewer:
--   update profiles set role = 'viewer'
--   where id = (select id from auth.users where email = 'email@example.com');
--
-- Promote to admin:
--   update profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'email@example.com');
-- ============================================
