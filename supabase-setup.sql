-- ============================================
-- Cherrywood Farm & Golf Club
-- Tee Time Booking System - Database Setup
-- Run this in the Supabase SQL Editor:
--   Dashboard → SQL Editor → New query → paste → Run
-- ============================================

-- Bookings table
create table if not exists bookings (
  id uuid default gen_random_uuid() primary key,
  confirmation_no text unique not null,
  slot_time timestamptz not null,
  name text not null,
  phone text not null,
  email text,
  num_players int not null default 1,
  num_carts int not null default 0,
  holes int not null default 9,
  status text not null default 'confirmed',
  notes text,
  created_at timestamptz default now()
);

-- Blocks table (for admin to block time slots)
create table if not exists blocks (
  id uuid default gen_random_uuid() primary key,
  from_time timestamptz not null,
  to_time timestamptz not null,
  reason text
);

-- Enable RLS
alter table bookings enable row level security;
alter table blocks enable row level security;

-- Drop existing policies if re-running
drop policy if exists "Anyone can create booking" on bookings;
drop policy if exists "Anyone can read bookings" on bookings;
drop policy if exists "Anyone can read blocks" on blocks;

-- RLS policies
-- Anyone can create a booking
create policy "Anyone can create booking" on bookings
  for insert with check (true);

-- Anyone can read bookings (for availability checking)
create policy "Anyone can read bookings" on bookings
  for select using (true);

-- Anyone can read blocks (for availability)
create policy "Anyone can read blocks" on blocks
  for select using (true);

-- Indexes for performance
create index if not exists bookings_slot_time_idx on bookings (slot_time);
create index if not exists blocks_from_to_idx on blocks (from_time, to_time);
