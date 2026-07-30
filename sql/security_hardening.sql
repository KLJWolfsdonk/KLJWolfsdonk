-- Run this in the Supabase SQL Editor, AFTER sql/contract_signing_v3.sql.
-- Recommended: run sql/security_audit.sql first and after, to see the
-- before/after state.
--
-- WHAT THIS FIXES
-- ----------------
-- getAllForAvailability() (used by the public booking calendar) returned
-- every reservation's `id` to any anonymous visitor. That same `id` was
-- the ONLY thing guarding get_reservation_for_contract/
-- sign_reservation_contract, which return a renter's name/phone/address/
-- order details and let anyone place a signature. Combined, this meant
-- any visitor could harvest every reservation id from the calendar feed
-- and then read (or forge a signature on) any renter's contract — no
-- login needed. This script:
--   1. Adds a dedicated, never-publicly-listed access_token per
--      reservation, and repoints the two contract RPCs to key off it
--      instead of the (now-public) id.
--   2. Replaces the direct-table availability query with a SECURITY
--      DEFINER RPC that never includes `id` at all.
--   3. Locks down direct table access for the anon role: INSERT only
--      (needed to create a booking), no SELECT/UPDATE/DELETE. All public
--      reads go through purpose-built RPCs from here on.
-- The admin panel is unaffected — it runs as an authenticated Supabase
-- user, which keeps full access below.


-- 1. Access token, decoupled from the public/primary-key `id`.
alter table reservations
	add column if not exists access_token uuid not null default gen_random_uuid();

create unique index if not exists reservations_access_token_key
	on reservations (access_token);


-- 2. Contract RPCs now key off the token, not the id. Postgres refuses to
--    rename a parameter via create-or-replace ("cannot change name of
--    input parameter"), so the old versions must be dropped first.
drop function if exists get_reservation_for_contract(uuid);
drop function if exists sign_reservation_contract(uuid, text, jsonb);

create or replace function get_reservation_for_contract(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	result jsonb;
begin
	select jsonb_build_object(
		'id', r.id,
		'status', r.status,
		'startDatum', r.start_date,
		'eindDatum', r.end_date,
		'totaal', r.total,
		'waarborgTotaal', r.deposit_total,
		'contractSignedAt', r.contract_signed_at,
		'contractSignatureData', r.contract_signature_data,
		'contractSnapshot', r.contract_snapshot,
		'klant', jsonb_build_object(
			'naam', c.name,
			'telefoon', c.phone,
			'straat', c.street,
			'huisnummer', c.house_number,
			'postcode', c.postal_code,
			'gemeente', c.city,
			'land', c.country
		),
		'producten', coalesce((
			select jsonb_agg(jsonb_build_object(
				'naam', ri.product_name,
				'quantity', ri.quantity,
				'prijsPerDag', ri.price_per_day,
				'waarborgPerStuk', ri.deposit_per_item,
				'linePrijs', ri.line_total,
				'lineWaarborg', ri.line_deposit
			) order by ri.product_name)
			from reservation_items ri
			where ri.reservation_id = r.id
		), '[]'::jsonb)
	)
	into result
	from reservations r
	join customers c on c.id = r.customer_id
	where r.access_token = p_token
		and r.status = 'bevestigd';

	return result;
end;
$$;

revoke all on function get_reservation_for_contract(uuid) from public;
grant execute on function get_reservation_for_contract(uuid) to anon;


create or replace function sign_reservation_contract(
	p_token uuid,
	p_signature_data text,
	p_contract_snapshot jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	target reservations;
begin
	select * into target
	from reservations
	where access_token = p_token
		and status = 'bevestigd';

	if target.id is null then
		raise exception 'Reservatie niet gevonden of nog niet bevestigd.';
	end if;

	if target.contract_signed_at is null then

		update reservations
		set contract_signature_data = p_signature_data,
			contract_snapshot = p_contract_snapshot,
			contract_signed_at = now()
		where access_token = p_token
		returning * into target;

	end if;

	return jsonb_build_object(
		'id', target.id,
		'contractSignedAt', target.contract_signed_at
	);
end;
$$;

revoke all on function sign_reservation_contract(uuid, text, jsonb) from public;
grant execute on function sign_reservation_contract(uuid, text, jsonb) to anon;


-- 3. Public availability feed, with no id and no path to any single
--    reservation's identity — just enough to grey out booked dates.
create or replace function get_availability()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
	select coalesce(jsonb_agg(jsonb_build_object(
		'status', r.status,
		'startDatum', r.start_date,
		'eindDatum', r.end_date,
		'producten', coalesce((
			select jsonb_agg(jsonb_build_object(
				'productId', ri.product_id,
				'quantity', ri.quantity
			))
			from reservation_items ri
			where ri.reservation_id = r.id
		), '[]'::jsonb)
	)), '[]'::jsonb)
	from reservations r;
$$;

revoke all on function get_availability() from public;
grant execute on function get_availability() to anon;


-- 4. Lock down direct table access. RLS on, anon gets INSERT only
--    (needed to create a booking); every anon read/write beyond that now
--    goes through the RPCs above. Authenticated (the admin panel) keeps
--    full access, unchanged.
alter table customers enable row level security;
alter table reservations enable row level security;
alter table reservation_items enable row level security;

revoke select, update, delete on customers from anon;
revoke select, update, delete on reservations from anon;
revoke select, update, delete on reservation_items from anon;

grant insert on customers to anon;
grant insert on reservations to anon;
grant insert on reservation_items to anon;

grant select, insert, update, delete on customers to authenticated;
grant select, insert, update, delete on reservations to authenticated;
grant select, insert, update, delete on reservation_items to authenticated;

drop policy if exists "anon insert customers" on customers;
create policy "anon insert customers"
	on customers
	for insert
	to anon
	with check (true);

drop policy if exists "anon insert reservations" on reservations;
create policy "anon insert reservations"
	on reservations
	for insert
	to anon
	-- Blocks a raw REST call from directly creating a pre-confirmed/paid
	-- reservation; every new booking must start as a plain "aanvraag".
	with check (status = 'aanvraag');

drop policy if exists "anon insert reservation_items" on reservation_items;
create policy "anon insert reservation_items"
	on reservation_items
	for insert
	to anon
	with check (true);

drop policy if exists "authenticated full access customers" on customers;
create policy "authenticated full access customers"
	on customers
	for all
	to authenticated
	using (true)
	with check (true);

drop policy if exists "authenticated full access reservations" on reservations;
create policy "authenticated full access reservations"
	on reservations
	for all
	to authenticated
	using (true)
	with check (true);

drop policy if exists "authenticated full access reservation_items" on reservation_items;
create policy "authenticated full access reservation_items"
	on reservation_items
	for all
	to authenticated
	using (true)
	with check (true);

-- Note: this "authenticated full access customers" policy supersedes the
-- narrower "authenticated can delete customers" policy added earlier in
-- sql/gdpr_customer_erasure.sql. That older policy is now redundant but
-- harmless (Postgres just applies both) — no need to drop it.


-- 5. Bonus, same principle: only admin/products.js ever creates/edits/
--    deletes products, so anon should only ever be able to read the
--    active catalog — not write to it (price/stock tampering) — and
--    shouldn't see deactivated products via a raw REST call either.
alter table products enable row level security;

revoke insert, update, delete on products from anon;
grant select on products to anon;

grant select, insert, update, delete on products to authenticated;

drop policy if exists "anon read active products" on products;
create policy "anon read active products"
	on products
	for select
	to anon
	using (active = true);

drop policy if exists "authenticated full access products" on products;
create policy "authenticated full access products"
	on products
	for all
	to authenticated
	using (true)
	with check (true);
