-- Run this in the Supabase SQL Editor, AFTER sql/contract_signing_v2.sql.
--
-- get_reservation_for_contract previously omitted the signature/snapshot,
-- so a huurder revisiting their contract link after having already signed
-- could see "already signed" but not download their own copy. This adds
-- those two fields to the RPC's result (same function signature, so a
-- plain create-or-replace is enough — no need to drop first).

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
	where r.id = p_id
		and r.status = 'bevestigd';

	return result;
end;
$$;

revoke all on function get_reservation_for_contract(uuid) from public;
grant execute on function get_reservation_for_contract(uuid) to anon;
