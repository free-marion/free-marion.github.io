-- ============================================
-- Accountability Chart — People & Title Update
-- ============================================

-- Role title updates
update accountability_nodes set role_name = 'Owner / Visionary'    where role_name = 'Visionary';
update accountability_nodes set role_name = 'Head of Finance'       where role_name = 'Director of Finance';
update accountability_nodes set role_name = 'Head of Groundskeeping' where role_name = 'Building & Grounds Manager';
update accountability_nodes set role_name = 'Farm Manager'          where role_name = 'Farm Operations Manager';

-- Person assignments
update accountability_nodes set person_name = 'Dale Cooper'     where role_name = 'Owner / Visionary';
update accountability_nodes set person_name = 'Brian Davis'     where role_name = 'Integrator';
update accountability_nodes set person_name = 'Seth Golding'    where role_name = 'Head of Finance';
update accountability_nodes set person_name = 'Chris Bird'      where role_name = 'Head of Groundskeeping';
update accountability_nodes set person_name = 'Dalton Phillips' where role_name = 'Farm Manager';

-- Clubhouse Attendants (Jody, Hannah, Teagan in order)
update accountability_nodes set person_name = 'Jody'   where role_name = 'Clubhouse Attendant' and sort_order = 1;
update accountability_nodes set person_name = 'Hannah' where role_name = 'Clubhouse Attendant' and sort_order = 2;
update accountability_nodes set person_name = 'Teagan' where role_name = 'Clubhouse Attendant' and sort_order = 3;

-- Grounds: Josh under Chris Bird
update accountability_nodes set person_name = 'Josh' where role_name = 'Turf & Grounds Technician' and sort_order = 1;

-- Clear the old Farm Hand placeholder (Dalton moved to Farm Manager)
update accountability_nodes set person_name = null where role_name = 'Farm Hand';
