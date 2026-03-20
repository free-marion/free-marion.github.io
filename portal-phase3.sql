-- ============================================
-- Cherrywood Team Portal — Phase 3 Schema
-- Run in Supabase SQL Editor after portal-phase2.sql
-- ============================================

-- V/TO (Vision/Traction Organizer) — singleton document
create table if not exists vto (
  id int primary key default 1 check (id = 1),
  core_values text not null default '[]',
  core_focus_purpose text not null default '',
  core_focus_niche text not null default '',
  ten_year_target text not null default '',
  mktg_target_market text not null default '',
  mktg_uniques text not null default '[]',
  mktg_proven_process text not null default '',
  mktg_guarantee text not null default '',
  three_year_picture text not null default '',
  one_year_plan text not null default '',
  updated_by uuid references auth.users,
  updated_at timestamptz default now()
);

insert into vto (id) values (1) on conflict do nothing;

alter table vto enable row level security;
drop policy if exists "Authenticated can read vto"   on vto;
drop policy if exists "Authenticated can update vto" on vto;
create policy "Authenticated can read vto"   on vto for select using (auth.uid() is not null);
create policy "Authenticated can update vto" on vto for update using (auth.uid() is not null) with check (auth.uid() is not null);

-- Accountability chart nodes (self-referencing tree)
create table if not exists accountability_nodes (
  id uuid default gen_random_uuid() primary key,
  role_name text not null,
  person_name text,
  parent_id uuid references accountability_nodes(id) on delete set null,
  sort_order int not null default 0,
  created_at timestamptz default now()
);

alter table accountability_nodes enable row level security;
drop policy if exists "Authenticated can read nodes"   on accountability_nodes;
drop policy if exists "Authenticated can manage nodes" on accountability_nodes;
create policy "Authenticated can read nodes"   on accountability_nodes for select using (auth.uid() is not null);
create policy "Authenticated can manage nodes" on accountability_nodes for all
  using (auth.uid() is not null) with check (auth.uid() is not null);

create index if not exists nodes_parent_idx on accountability_nodes (parent_id);
