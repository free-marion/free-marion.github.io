-- ============================================
-- Cherrywood Portal — Access Audit (READ-ONLY)
-- Run in Supabase SQL Editor. Changes nothing.
-- Paste the results back to Marion.
-- ============================================

-- 1. Current profiles table structure
select column_name, data_type, column_default, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'profiles'
order by ordinal_position;

-- 2. Everyone who currently has a profile, and what role they landed on
select p.id, p.email, p.display_name, p.role, p.tools, p.created_at
from profiles p
order by p.created_at;

-- 3. Current RLS policies on the tables this migration would touch
select tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('profiles', 'tournaments')
order by tablename, cmd;

-- 4. Current trigger + function definition for handle_new_user
select p.proname, pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'handle_new_user';
