-- ============================================================
-- Toolbox: per-user tab and action visibility
-- ============================================================

-- Add tools JSONB column to profiles.
-- Default grants all 4 tabs + eggs:pickup for non-admins.
-- Admins ignore this column entirely (full access by role).
alter table profiles
  add column if not exists tools jsonb not null
  default '{"tabs":["tournaments","eggs","resources","crm"],"actions":["eggs:pickup"]}';

-- Seed existing non-admin users with the default tools.
update profiles
set tools = '{"tabs":["tournaments","eggs","resources","crm"],"actions":["eggs:pickup"]}'
where tools = '{}';
