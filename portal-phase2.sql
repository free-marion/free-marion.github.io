-- ============================================
-- Cherrywood Team Portal — Phase 2 Schema
-- Run in Supabase SQL Editor after portal-setup.sql
-- ============================================

-- To-Dos (7-day action items, distinct from 90-day Rocks)
create table if not exists todos (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users not null,
  owner_name text,
  title text not null,
  due_date date,
  done boolean not null default false,
  week_created date not null default date_trunc('week', current_date)::date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Meeting logs (store L10 meeting records)
create table if not exists meeting_logs (
  id uuid default gen_random_uuid() primary key,
  meeting_date date not null default current_date,
  rating int,                          -- 1–10 meeting rating
  segue_notes text,                    -- JSON array of segue entries
  headlines text,                      -- JSON array of headline entries
  cascading_messages text,             -- free text
  created_by uuid references auth.users not null,
  created_at timestamptz default now()
);

-- RLS
alter table todos enable row level security;
alter table meeting_logs enable row level security;

drop policy if exists "Users can read all todos"       on todos;
drop policy if exists "Authenticated can create todos" on todos;
drop policy if exists "Todo owner can update"          on todos;
drop policy if exists "Todo owner can delete"          on todos;
drop policy if exists "Users can read meeting logs"    on meeting_logs;
drop policy if exists "Authenticated can log meetings" on meeting_logs;

create policy "Users can read all todos"       on todos for select  using (auth.uid() is not null);
create policy "Authenticated can create todos" on todos for insert  with check (auth.uid() is not null);
create policy "Todo owner can update"          on todos for update  using (auth.uid() = owner_id);
create policy "Todo owner can delete"          on todos for delete  using (auth.uid() = owner_id);
create policy "Users can read meeting logs"    on meeting_logs for select using (auth.uid() is not null);
create policy "Authenticated can log meetings" on meeting_logs for insert with check (auth.uid() is not null);

-- Trigger
drop trigger if exists set_todos_updated_at on todos;
create trigger set_todos_updated_at before update on todos for each row execute procedure set_updated_at();

-- Indexes
create index if not exists todos_owner_idx       on todos (owner_id);
create index if not exists todos_week_idx        on todos (week_created);
create index if not exists meeting_logs_date_idx on meeting_logs (meeting_date);
