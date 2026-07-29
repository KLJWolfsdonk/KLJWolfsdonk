-- Run this in the Supabase SQL Editor.
-- Adds the ability for a customer to view & sign their rental contract via
-- an unguessable link (the reservation's own UUID), without loosening RLS
-- to expose all reservations/customers through the public anon key.
--
-- The signature is stored as a base64 PNG data URL directly in a text
-- column (contract_signature_data) instead of a Storage file, so no new
-- Storage bucket or upload policy is needed.


-- 1. New columns on reservations
alter table reservations
	add column if not exists contract_signed_at timestamptz,
	add column if not exists contract_signature_data text;


-- 2. Fetch everything needed to render the contract, keyed by the
--    reservation's own id. SECURITY DEFINER lets it read customers/
--    reservation_items despite anon's restrictive RLS, but it only
--    ever returns the single row matching p_id, and only once the
--    reservation has been confirmed by an admin.
create or replace function get_reservation_for_contract(p_id uuid)
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
	where r.id = p_id
		and r.status = 'bevestigd';

	return result;
end;
$$;

revoke all on function get_reservation_for_contract(uuid) from public;
grant execute on function get_reservation_for_contract(uuid) to anon;


-- 3. Save the drawn signature, once, for a confirmed reservation.
--    Idempotent: if it's already signed, later calls just report the
--    existing signed-at timestamp instead of overwriting the signature.
create or replace function sign_reservation_contract(p_id uuid, p_signature_data text)
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
	where id = p_id
		and status = 'bevestigd';

	if target.id is null then
		raise exception 'Reservatie niet gevonden of nog niet bevestigd.';
	end if;

	if target.contract_signed_at is null then

		update reservations
		set contract_signature_data = p_signature_data,
			contract_signed_at = now()
		where id = p_id
		returning * into target;

	end if;

	return jsonb_build_object(
		'id', target.id,
		'contractSignedAt', target.contract_signed_at
	);
end;
$$;

revoke all on function sign_reservation_contract(uuid, text) from public;
grant execute on function sign_reservation_contract(uuid, text) to anon;
