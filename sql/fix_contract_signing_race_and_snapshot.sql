-- Run in the Supabase SQL Editor, after sql/security_hardening.sql.
--
-- WHAT THIS FIXES
-- ----------------
-- 1. sign_reservation_contract() stored whatever `p_contract_snapshot`
--    jsonb blob the client sent, with no check that it matches the actual
--    reservation. That snapshot is meant to be the permanent legal record
--    of what was agreed (price, products, terms) — but since this RPC is
--    anon-executable (gated only by knowing the access_token from the
--    emailed contract link), anyone with their own valid token could call
--    it directly (devtools/curl) with a forged price/product list and have
--    THAT become the permanent record, defeating its whole purpose.
--    Fix: the RPC now builds the money/product/customer fields itself from
--    the `reservations`/`customers`/`reservation_items` tables (same query
--    get_reservation_for_contract already uses), so those can no longer be
--    forged. Only the non-financial display fields (terms text/version,
--    generated-at timestamp — same for every signer, not a dispute risk)
--    are still accepted from the client.
--
-- 2. The function read the row with a plain SELECT (no lock), checked
--    contract_signed_at IS NULL in PL/pgSQL, then ran an unconditional
--    UPDATE. Two concurrent sign attempts on the same token (e.g. the
--    contract link opened in two tabs) could both pass the NULL check
--    before either UPDATE commits, so the second silently overwrites the
--    first signature/snapshot/timestamp — contradicting the intent that a
--    signed contract is immutable.
--    Fix: SELECT ... FOR UPDATE locks the row first, so a concurrent call
--    blocks until the first transaction commits, then sees
--    contract_signed_at is no longer null and raises instead of
--    overwriting.
--
-- Since the parameter list changes (p_contract_snapshot jsonb is replaced
-- by p_terms_version/p_terms_articles/p_generated_at), the old function
-- must be dropped first — create-or-replace can't rename/retype params.

drop function if exists sign_reservation_contract(uuid, text, jsonb);

create or replace function sign_reservation_contract(
	p_token uuid,
	p_signature_data text,
	p_terms_version text,
	p_terms_articles jsonb,
	p_generated_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	target reservations;
	v_snapshot jsonb;
begin

	select * into target
	from reservations
	where access_token = p_token
		and status = 'bevestigd'
	for update;

	if target.id is null then
		raise exception 'Reservatie niet gevonden of nog niet bevestigd.';
	end if;

	if target.contract_signed_at is not null then
		raise exception 'Dit contract is al ondertekend.';
	end if;

	select jsonb_build_object(
		'id', r.id,
		'status', r.status,
		'startDatum', r.start_date,
		'eindDatum', r.end_date,
		'totaal', r.total,
		'waarborgTotaal', r.deposit_total,
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
		), '[]'::jsonb),
		'termsVersion', p_terms_version,
		'termsArticles', p_terms_articles,
		'generatedAt', coalesce(p_generated_at, now())
	)
	into v_snapshot
	from reservations r
	join customers c on c.id = r.customer_id
	where r.id = target.id;

	update reservations
	set contract_signature_data = p_signature_data,
		contract_snapshot = v_snapshot,
		contract_signed_at = now()
	where id = target.id
	returning * into target;

	return jsonb_build_object(
		'id', target.id,
		'contractSignedAt', target.contract_signed_at,
		'contractSnapshot', target.contract_snapshot
	);
end;
$$;

revoke all on function sign_reservation_contract(uuid, text, text, jsonb, timestamptz) from public;
grant execute on function sign_reservation_contract(uuid, text, text, jsonb, timestamptz) to anon;
