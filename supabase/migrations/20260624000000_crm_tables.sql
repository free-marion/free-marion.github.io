
-- ============================================================
-- CRM: contacts, memberships, interactions, event_inquiries
-- ============================================================

-- Contacts (the core CRM entity)
create table if not exists contacts (
  id         uuid default gen_random_uuid() primary key,
  first_name text not null,
  last_name  text not null,
  phone      text,
  email      text,
  address    text,
  type       text check (type in ('member','guest','event_inquiry','vendor','donor','other')),
  source     text,
  notes      text,
  created_by uuid references auth.users,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Memberships (linked to a contact)
create table if not exists memberships (
  id         uuid default gen_random_uuid() primary key,
  contact_id uuid references contacts on delete cascade not null,
  type       text check (type in ('individual','family','seasonal','corporate')),
  status     text not null default 'active' check (status in ('active','expired','cancelled')),
  start_date date,
  end_date   date,
  fee_paid   numeric(10,2),
  notes      text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Interactions (call, email, visit log)
create table if not exists interactions (
  id               uuid default gen_random_uuid() primary key,
  contact_id       uuid references contacts on delete cascade not null,
  interaction_date date not null default current_date,
  type             text check (type in ('call','email','visit','inquiry','note')),
  summary          text not null,
  logged_by        uuid references auth.users,
  created_at       timestamptz default now()
);

-- Event inquiries (wedding, corporate, etc.)
create table if not exists event_inquiries (
  id             uuid default gen_random_uuid() primary key,
  contact_id     uuid references contacts on delete cascade not null,
  event_type     text check (event_type in ('wedding','corporate','birthday','tournament','other')),
  requested_date date,
  headcount      int,
  status         text not null default 'new' check (status in ('new','quoted','booked','lost')),
  notes          text,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);


-- CRM RLS

alter table contacts       enable row level security;
alter table memberships    enable row level security;
alter table interactions   enable row level security;
alter table event_inquiries enable row level security;

-- contacts
create policy "Authenticated can read contacts"   on contacts for select using (auth.uid() is not null);
create policy "Authenticated can insert contacts" on contacts for insert with check (auth.uid() is not null);
create policy "Authenticated can update contacts" on contacts for update using (auth.uid() is not null) with check (auth.uid() is not null);

-- memberships
create policy "Authenticated can read memberships"   on memberships for select using (auth.uid() is not null);
create policy "Authenticated can insert memberships" on memberships for insert with check (auth.uid() is not null);
create policy "Authenticated can update memberships" on memberships for update using (auth.uid() is not null) with check (auth.uid() is not null);

-- interactions
create policy "Authenticated can read interactions"   on interactions for select using (auth.uid() is not null);
create policy "Authenticated can insert interactions" on interactions for insert with check (auth.uid() is not null);
create policy "Authenticated can update interactions" on interactions for update using (auth.uid() is not null) with check (auth.uid() is not null);

-- event_inquiries
create policy "Authenticated can read event_inquiries"   on event_inquiries for select using (auth.uid() is not null);
create policy "Authenticated can insert event_inquiries" on event_inquiries for insert with check (auth.uid() is not null);
create policy "Authenticated can update event_inquiries" on event_inquiries for update using (auth.uid() is not null) with check (auth.uid() is not null);


-- CRM updated_at triggers

drop trigger if exists set_contacts_updated_at      on contacts;
drop trigger if exists set_memberships_updated_at   on memberships;
drop trigger if exists set_event_inquiries_updated_at on event_inquiries;

create trigger set_contacts_updated_at
  before update on contacts
  for each row execute procedure set_updated_at();

create trigger set_memberships_updated_at
  before update on memberships
  for each row execute procedure set_updated_at();

create trigger set_event_inquiries_updated_at
  before update on event_inquiries
  for each row execute procedure set_updated_at();


-- CRM indexes

create index if not exists contacts_type_idx             on contacts (type);
create index if not exists contacts_last_name_idx        on contacts (last_name);
create index if not exists memberships_contact_status_idx on memberships (contact_id, status);
create index if not exists interactions_contact_idx      on interactions (contact_id);
create index if not exists event_inquiries_contact_idx   on event_inquiries (contact_id, status);


-- ============================================================
-- ROLE GRANTS
-- Supabase-managed roles need table-level grants so PostgREST
-- can apply RLS policies. Placed after all CREATE TABLE statements.
-- ============================================================

grant usage on schema public to anon, authenticated, service_role;

grant all on all tables    in schema public to postgres, service_role;
grant all on all sequences in schema public to postgres, service_role;
grant all on all routines  in schema public to postgres, service_role;

grant select, insert, update, delete on all tables    in schema public to authenticated;
grant usage, select                  on all sequences in schema public to authenticated;
grant select, insert, update, delete on all tables    in schema public to anon;
grant usage, select                  on all sequences in schema public to anon;
