-- Run in the Supabase SQL Editor.
--
-- WHAT THIS ADDS
-- ----------------
-- Admin notes on a reservation used to be a single free-text column
-- (reservations.admin_notes) that got overwritten on every save — no
-- record of who wrote what or when, so there was no accountability trail.
--
-- This adds an append-only reservation_notes table: every save inserts a
-- new row instead of overwriting, stamped with the admin's email and a
-- timestamp. Any existing reservations.admin_notes text is copied over as
-- the first log entry so nothing is lost; the app no longer writes to
-- admin_notes going forward (the column is left in place, unused).

create table if not exists reservation_notes (
	id uuid primary key default gen_random_uuid(),
	reservation_id uuid not null references reservations(id) on delete cascade,
	author_email text not null,
	note text not null,
	created_at timestamptz not null default now()
);

create index if not exists reservation_notes_reservation_id_idx
	on reservation_notes (reservation_id, created_at);

alter table reservation_notes enable row level security;

-- Admin-only, same pattern as the other tables in security_hardening.sql —
-- the admin panel runs as an authenticated Supabase user; anon gets nothing.
drop policy if exists "authenticated full access reservation_notes" on reservation_notes;
create policy "authenticated full access reservation_notes"
	on reservation_notes
	for all
	to authenticated
	using (true)
	with check (true);

grant select, insert, update, delete on reservation_notes to authenticated;

-- One-time backfill: carry over any existing free-text note as the first
-- log entry, attributed to "onbekend" (unknown) since we don't know who
-- wrote the old value.
insert into reservation_notes (reservation_id, author_email, note, created_at)
select id, 'onbekend', admin_notes, coalesce(updated_at, created_at)
from reservations
where admin_notes is not null and btrim(admin_notes) <> '';
