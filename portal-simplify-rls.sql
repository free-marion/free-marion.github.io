-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Simplifies RLS so any authenticated user can read and manage tournaments and registrations.

-- TOURNAMENTS
drop policy if exists "Authenticated can read tournaments"   on tournaments;
drop policy if exists "Authorized can manage tournaments"    on tournaments;
drop policy if exists "Anyone can read tournaments"          on tournaments;
drop policy if exists "Authenticated users can manage tournaments" on tournaments;

create policy "Authenticated can read tournaments"
  on tournaments for select
  using (auth.uid() is not null);

create policy "Authenticated can manage tournaments"
  on tournaments for all
  using  (auth.uid() is not null)
  with check (auth.uid() is not null);

-- TOURNAMENT REGISTRATIONS
drop policy if exists "Anyone can register for tournament"                on tournament_registrations;
drop policy if exists "Authenticated can read tournament registrations"   on tournament_registrations;
drop policy if exists "Authorized can read tournament registrations"      on tournament_registrations;
drop policy if exists "Authorized can update tournament registrations"    on tournament_registrations;
drop policy if exists "Anyone can read tournament registrations"          on tournament_registrations;
drop policy if exists "Authenticated users can manage registrations"      on tournament_registrations;

create policy "Anyone can register for tournament"
  on tournament_registrations for insert
  with check (true);

create policy "Authenticated can read tournament registrations"
  on tournament_registrations for select
  using (auth.uid() is not null);

create policy "Authenticated can update tournament registrations"
  on tournament_registrations for update
  using  (auth.uid() is not null)
  with check (auth.uid() is not null);
