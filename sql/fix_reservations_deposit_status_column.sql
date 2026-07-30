-- Run in the Supabase SQL Editor.
--
-- WHAT THIS FIXES
-- ----------------
-- create_reservation() (see sql/reservation_availability_check.sql) reads
-- v_reservation.deposit_status when building its return value, and
-- SupabaseReservationRepository.js reads row.deposit_status when loading
-- reservations. That column was never actually added to the `reservations`
-- table, so every booking attempt fails with:
--   record "v_reservation" has no field "deposit_status"
--
-- Adding it with a default backfills existing rows too.

alter table reservations
	add column if not exists deposit_status text not null default 'open';
