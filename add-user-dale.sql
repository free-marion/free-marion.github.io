update profiles set role = 'admin'
where id = (select id from auth.users where email = 'dale@safeslides.com');
