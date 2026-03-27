-- ============================================
-- Cherrywood Accountability Chart Import
-- From PDF dated 3/20/2026
--
-- HOW TO RUN:
--   Supabase → SQL Editor → New query → paste → Run
-- ============================================

-- Clear existing nodes if re-running
delete from accountability_nodes;

-- Insert the full tree using CTEs so parent IDs chain correctly
with
  -- LEVEL 0: Visionary (root)
  visionary as (
    insert into accountability_nodes (role_name, person_name, parent_id, sort_order)
    values ('Visionary', 'Dale Cooper', null, 1)
    returning id
  ),

  -- LEVEL 1: Integrator
  integrator as (
    insert into accountability_nodes (role_name, person_name, parent_id, sort_order)
    select 'Integrator', 'Brian Davis', id, 1 from visionary
    returning id
  ),

  -- LEVEL 2: Director of Operations + Director of Finance
  dir_ops as (
    insert into accountability_nodes (role_name, person_name, parent_id, sort_order)
    select 'Director of Operations', 'Dale Cooper', id, 1 from integrator
    returning id
  ),
  dir_fin as (
    insert into accountability_nodes (role_name, person_name, parent_id, sort_order)
    select 'Director of Finance', 'Seth Golding', id, 2 from integrator
    returning id
  ),

  -- LEVEL 3: Under Director of Operations
  clubhouse_mgr as (
    insert into accountability_nodes (role_name, person_name, parent_id, sort_order)
    select 'Clubhouse Manager', 'Jessica Holland', id, 1 from dir_ops
    returning id
  ),
  grounds_mgr as (
    insert into accountability_nodes (role_name, person_name, parent_id, sort_order)
    select 'Building & Grounds Manager', 'Chris Bird', id, 2 from dir_ops
    returning id
  ),
  farm_ops_mgr as (
    insert into accountability_nodes (role_name, person_name, parent_id, sort_order)
    select 'Farm Operations Manager', 'Steve Cooper', id, 3 from dir_ops
    returning id
  ),
  sales_mktg as (
    insert into accountability_nodes (role_name, person_name, parent_id, sort_order)
    select 'Sales / Marketing', 'Jessica Holland', id, 4 from dir_ops
    returning id
  ),

  -- LEVEL 3: Under Director of Finance
  hr as (
    insert into accountability_nodes (role_name, person_name, parent_id, sort_order)
    select 'Human Resources', 'Seth Golding', id, 1 from dir_fin
    returning id
  ),

  -- LEVEL 4: Under Clubhouse Manager
  ca1 as (
    insert into accountability_nodes (role_name, person_name, parent_id, sort_order)
    select 'Clubhouse Attendant', 'Guss', id, 1 from clubhouse_mgr
    returning id
  ),
  ca2 as (
    insert into accountability_nodes (role_name, person_name, parent_id, sort_order)
    select 'Clubhouse Attendant', 'Garret', id, 2 from clubhouse_mgr
    returning id
  ),
  ca3 as (
    insert into accountability_nodes (role_name, person_name, parent_id, sort_order)
    select 'Clubhouse Attendant', 'Jodi', id, 3 from clubhouse_mgr
    returning id
  ),

  -- LEVEL 4: Under Building & Grounds Manager (3 open seats)
  tgt1 as (
    insert into accountability_nodes (role_name, person_name, parent_id, sort_order)
    select 'Turf & Grounds Technician', null, id, 1 from grounds_mgr
    returning id
  ),
  tgt2 as (
    insert into accountability_nodes (role_name, person_name, parent_id, sort_order)
    select 'Turf & Grounds Technician', null, id, 2 from grounds_mgr
    returning id
  ),
  tgt3 as (
    insert into accountability_nodes (role_name, person_name, parent_id, sort_order)
    select 'Turf & Grounds Technician', null, id, 3 from grounds_mgr
    returning id
  ),

  -- LEVEL 4: Under Farm Operations Manager
  farmhand as (
    insert into accountability_nodes (role_name, person_name, parent_id, sort_order)
    select 'Farm Hand', 'Dalton', id, 1 from farm_ops_mgr
    returning id
  )

select 'Accountability chart imported: 16 nodes.' as result;
