-- ============================================
-- Egg Orders Table
-- Paste into Supabase SQL Editor and Run
-- ============================================

create table if not exists egg_orders (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  contact text not null,
  dozens int not null default 1,
  pickup_date date,
  notes text,
  status text not null default 'pending',
  created_at timestamptz default now()
);

alter table egg_orders enable row level security;

drop policy if exists "Anyone can submit egg order"      on egg_orders;
drop policy if exists "Authenticated can read egg orders" on egg_orders;
drop policy if exists "Authenticated can update egg orders" on egg_orders;

create policy "Anyone can submit egg order"
  on egg_orders for insert with check (true);

create policy "Authenticated can read egg orders"
  on egg_orders for select using (auth.uid() is not null);

create policy "Authenticated can update egg orders"
  on egg_orders for update using (auth.uid() is not null);
