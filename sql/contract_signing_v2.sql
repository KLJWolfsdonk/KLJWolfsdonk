-- Run this in the Supabase SQL Editor, AFTER sql/contract_signing.sql has
-- already been applied.
--
-- Adds an immutable snapshot of exactly what the huurder saw and signed
-- (customer info, material list, prices, and the legal articles as they
-- read at signing time) so that later edits to the reservation or to the
-- contract wording never change what a past signature legally covers.


-- 1. New column for the snapshot
alter table reservations
	add column if not exists contract_snapshot jsonb;


-- 2. Replace sign_reservation_contract to also store the snapshot.
--    Adding a parameter changes the function's signature, so the old
--    2-argument version is dropped first to avoid leaving a stale
--    duplicate overload around.
drop function if exists sign_reservation_contract(uuid, text);

create or replace function sign_reservation_contract(
	p_id uuid,
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
	where id = p_id
		and status = 'bevestigd';

	if target.id is null then
		raise exception 'Reservatie niet gevonden of nog niet bevestigd.';
	end if;

	if target.contract_signed_at is null then

		update reservations
		set contract_signature_data = p_signature_data,
			contract_snapshot = p_contract_snapshot,
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

revoke all on function sign_reservation_contract(uuid, text, jsonb) from public;
grant execute on function sign_reservation_contract(uuid, text, jsonb) to anon;
