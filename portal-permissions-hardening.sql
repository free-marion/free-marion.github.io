-- ============================================
-- Cherrywood Portal — Permissions Hardening
-- Run once in Supabase SQL Editor
-- ============================================
-- Fixes identified in Phase 1/2 audit:
--   1. perm columns may not exist on profiles
--   2. profiles UPDATE was self-only — admin perm toggles were silently failing
--   3. bookings had NO update policy — unauthenticated writes possible
--   4. egg_orders update allowed any authenticated user
--   5. accountability_nodes write allowed any authenticated user
--   6. tournaments/registrations/membership_applications RLS unknown/missing
-- ============================================


-- ============================================
-- STEP 1 — ENSURE PERM COLUMNS EXIST
-- Safe to re-run; add column only if missing
-- ============================================

alter table profiles add column if not exists name                    text;
alter table profiles add column if not exists email                   text;
alter table profiles add column if not exists perm_cancel_bookings    boolean not null default false;
alter table profiles add column if not exists perm_mark_eggs          boolean not null default false;
alter table profiles add column if not exists perm_manage_tournaments boolean not null default false;
alter table profiles add column if not exists perm_view_members       boolean not null default false;
alter table profiles add column if not exists perm_toggle_course      boolean not null default false;


-- ============================================
-- STEP 2 — SECURITY DEFINER HELPER FUNCTION
-- Checks role or named permission column
-- without triggering RLS recursion on profiles
-- ============================================

create or replace function public.portal_can(perm_col text)
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  result boolean;
begin
  if perm_col = 'admin' then
    select (role = 'admin')
    into result
    from public.profiles
    where id = auth.uid();
  else
    -- %I safely quotes the column name as an identifier (no SQL injection risk)
    execute format(
      'select coalesce(%I, false) or role = ''admin''
       from public.profiles where id = $1',
      perm_col
    ) into result using auth.uid();
  end if;
  return coalesce(result, false);
end;
$$;


-- ============================================
-- STEP 3 — PROFILES
-- Add admin-can-update-anyone policy.
-- The self-update policy already exists and stays.
-- ============================================

drop policy if exists "Admin can update any profile" on profiles;

create policy "Admin can update any profile"
  on profiles for update
  using  (public.portal_can('admin'))
  with check (public.portal_can('admin'));


-- ============================================
-- STEP 4 — BOOKINGS
-- Add update policy — previously NO policy existed.
-- Only perm_cancel_bookings holders (or admins) may update.
-- ============================================

drop policy if exists "Authenticated can update bookings" on bookings;
drop policy if exists "Authorized can update bookings"    on bookings;

create policy "Authorized can update bookings"
  on bookings for update
  using (public.portal_can('perm_cancel_bookings'));


-- ============================================
-- STEP 5 — EGG ORDERS
-- Tighten from "any authenticated" to perm holders only
-- ============================================

drop policy if exists "Authenticated can update egg orders" on egg_orders;
drop policy if exists "Authorized can update egg orders"    on egg_orders;

create policy "Authorized can update egg orders"
  on egg_orders for update
  using (public.portal_can('perm_mark_eggs'));


-- ============================================
-- STEP 6 — ACCOUNTABILITY NODES
-- Tighten from "any authenticated" to admin only
-- ============================================

drop policy if exists "Authenticated can manage nodes" on accountability_nodes;
drop policy if exists "Admin can manage nodes"         on accountability_nodes;

create policy "Admin can manage nodes"
  on accountability_nodes for all
  using  (public.portal_can('admin'))
  with check (public.portal_can('admin'));


-- ============================================
-- STEP 7 — TOURNAMENTS
-- ============================================

alter table if exists tournaments enable row level security;

drop policy if exists "Anyone can read tournaments"        on tournaments;
drop policy if exists "Authenticated can read tournaments" on tournaments;
drop policy if exists "Authorized can manage tournaments"  on tournaments;

-- Public/staff can read (needed for events page)
create policy "Authenticated can read tournaments"
  on tournaments for select
  using (auth.uid() is not null);

-- Only authorized staff can create / edit / cancel
create policy "Authorized can manage tournaments"
  on tournaments for all
  using  (public.portal_can('perm_manage_tournaments'))
  with check (public.portal_can('perm_manage_tournaments'));


-- ============================================
-- STEP 8 — TOURNAMENT REGISTRATIONS
-- ============================================

alter table if exists tournament_registrations enable row level security;

drop policy if exists "Anyone can register for tournament"                   on tournament_registrations;
drop policy if exists "Authenticated can read tournament registrations"      on tournament_registrations;
drop policy if exists "Authorized can update tournament registrations"       on tournament_registrations;

-- Public can self-register
create policy "Anyone can register for tournament"
  on tournament_registrations for insert
  with check (true);

-- Only perm holders can read the full list
create policy "Authorized can read tournament registrations"
  on tournament_registrations for select
  using (public.portal_can('perm_manage_tournaments'));

-- Only perm holders can update (e.g. status changes)
create policy "Authorized can update tournament registrations"
  on tournament_registrations for update
  using (public.portal_can('perm_manage_tournaments'));


-- ============================================
-- STEP 9 — MEMBERSHIP APPLICATIONS
-- ============================================

alter table if exists membership_applications enable row level security;

drop policy if exists "Anyone can submit membership application"          on membership_applications;
drop policy if exists "Authenticated can read membership applications"    on membership_applications;
drop policy if exists "Authorized can read membership applications"       on membership_applications;
drop policy if exists "Authorized can update membership applications"     on membership_applications;

-- Public form can insert
create policy "Anyone can submit membership application"
  on membership_applications for insert
  with check (true);

-- Only perm_view_members holders (or admin) can read
create policy "Authorized can read membership applications"
  on membership_applications for select
  using (public.portal_can('perm_view_members'));

-- Only perm_view_members holders (or admin) can update (mark contacted)
create policy "Authorized can update membership applications"
  on membership_applications for update
  using (public.portal_can('perm_view_members'));


-- ============================================
-- VERIFICATION
-- Run this after the above to confirm policies
-- ============================================
-- select tablename, policyname, cmd, qual
-- from pg_policies
-- where schemaname = 'public'
--   and tablename in (
--     'profiles','bookings','egg_orders',
--     'accountability_nodes','tournaments',
--     'tournament_registrations','membership_applications'
--   )
-- order by tablename, cmd;
