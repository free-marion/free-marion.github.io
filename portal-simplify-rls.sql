-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Opens tournaments and registrations to the anon key (no auth required).
-- The portal is protected by the client-side password gate instead.

-- TOURNAMENTS
drop policy if exists "Authenticated can read tournaments"        on tournaments;
drop policy if exists "Authenticated can manage tournaments"      on tournaments;
drop policy if exists "Authorized can manage tournaments"         on tournaments;
drop policy if exists "Anyone can read tournaments"               on tournaments;
drop policy if exists "Authenticated users can manage tournaments" on tournaments;

create policy "Anon can read tournaments"
  on tournaments for select
  using (true);

create policy "Anon can manage tournaments"
  on tournaments for all
  using  (true)
  with check (true);

-- TOURNAMENT REGISTRATIONS
drop policy if exists "Anyone can register for tournament"                on tournament_registrations;
drop policy if exists "Authenticated can read tournament registrations"   on tournament_registrations;
drop policy if exists "Authorized can read tournament registrations"      on tournament_registrations;
drop policy if exists "Authenticated can update tournament registrations" on tournament_registrations;
drop policy if exists "Authorized can update tournament registrations"    on tournament_registrations;
drop policy if exists "Anyone can read tournament registrations"          on tournament_registrations;
drop policy if exists "Authenticated users can manage registrations"      on tournament_registrations;

create policy "Anon can read tournament registrations"
  on tournament_registrations for select
  using (true);

create policy "Anon can insert tournament registrations"
  on tournament_registrations for insert
  with check (true);

create policy "Anon can update tournament registrations"
  on tournament_registrations for update
  using  (true)
  with check (true);

-- EGG ORDERS (update only — inserts come from the public egg form)
drop policy if exists "Anon can update egg orders" on egg_orders;

create policy "Anon can update egg orders"
  on egg_orders for update
  using  (true)
  with check (true);
