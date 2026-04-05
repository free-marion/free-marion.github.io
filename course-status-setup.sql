-- ============================================
-- Course Status Table
-- Paste into Supabase SQL Editor and Run
-- ============================================

create table if not exists course_status (
  id int primary key default 1 check (id = 1),
  is_open boolean not null default true,
  message text not null default 'Course is closed due to weather conditions. Check back soon.',
  closed_on date,          -- set to today (CT) on weather closure; null when open; resets naturally at midnight
  updated_at timestamptz default now()
);

insert into course_status (id) values (1) on conflict do nothing;

alter table course_status enable row level security;

drop policy if exists "Anyone can read course status"        on course_status;
drop policy if exists "Authenticated can update course status" on course_status;

create policy "Anyone can read course status"
  on course_status for select using (true);

create policy "Authorized can update course status"
  on course_status for update using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and (role = 'admin' or perm_toggle_course = true)
    )
  );
