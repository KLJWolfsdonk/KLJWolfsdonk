-- Read-only. Run this in the Supabase SQL Editor to see the CURRENT state
-- before running sql/security_hardening.sql, and again afterwards to
-- confirm it worked as expected.
--
-- What "safe" looks like after hardening:
--   - rls_enabled = true for customers/reservations/reservation_items
--   - pg_policies shows an "anon" INSERT-only policy per table, plus an
--     "authenticated" ALL policy per table
--   - table_privileges shows ONLY 'INSERT' for grantee 'anon' on
--     customers/reservations/reservation_items (no SELECT/UPDATE/DELETE)


select
	relname as table_name,
	relrowsecurity as rls_enabled,
	relforcerowsecurity as rls_forced
from pg_class
where relname in ('customers', 'reservations', 'reservation_items', 'products')
	and relnamespace = 'public'::regnamespace;


select
	schemaname,
	tablename,
	policyname,
	roles,
	cmd,
	qual,
	with_check
from pg_policies
where schemaname = 'public'
	and tablename in ('customers', 'reservations', 'reservation_items', 'products')
order by tablename, policyname;


select
	table_name,
	grantee,
	privilege_type
from information_schema.table_privileges
where table_schema = 'public'
	and table_name in ('customers', 'reservations', 'reservation_items', 'products')
	and grantee in ('anon', 'authenticated')
order by table_name, grantee, privilege_type;
