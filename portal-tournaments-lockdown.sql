-- ============================================
-- Cherrywood Portal — Tournaments Access Fix
-- Run in Supabase SQL Editor
-- ============================================
-- Closes: anonymous (unauthenticated) write access to tournaments,
--         and "any signed-in user regardless of role" write access.
-- Replaces with: any approved portal user (admin/staff/viewer) can
--         fully manage tournaments. Public read stays open (needed
--         for events.html).
-- ============================================

drop policy if exists "Anon can update tournaments" on tournaments;
drop policy if exists "Authenticated users can manage tournaments" on tournaments;
drop policy if exists "tournaments_auth_write" on tournaments;
drop policy if exists "Anyone can read tournaments" on tournaments;
-- "tournaments_public_read" (select, true) is left in place as the one public read policy

create policy "Portal users can manage tournaments"
  on tournaments for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('admin', 'staff', 'viewer')
    )
  )
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('admin', 'staff', 'viewer')
    )
  );
