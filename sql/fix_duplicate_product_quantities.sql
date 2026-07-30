-- Run in the Supabase SQL Editor, after sql/reservation_availability_check.sql.
--
-- WHAT THIS FIXES
-- ----------------
-- create_reservation() checks each line of p_producten against how much of
-- that product is ALREADY committed by OTHER reservations — but it never
-- accounted for multiple lines in the SAME request referencing the same
-- product. Each line was checked independently against the same
-- already-committed count, so e.g. two lines of 2x the same product
-- (stock = 2, nothing else booked) each individually pass the "0 + 2 <= 2"
-- check and the booking is created with 4 units against a stock of 2.
-- Since this RPC is anon-executable, that's reachable by anyone calling it
-- directly (devtools/curl), bypassing the cart UI's own de-duplication.
--
-- This replaces create_reservation() (same signature, so create-or-replace
-- is enough) with a version that first aggregates p_producten by productId
-- so repeated lines for the same product are summed and checked together.

create or replace function create_reservation(
	p_klant text,
	p_email text,
	p_telefoon text,
	p_adres jsonb,
	p_start_date date,
	p_end_date date,
	p_opmerkingen text,
	p_producten jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	v_aantal_dagen integer;
	v_customer_id uuid;
	v_reservation reservations;
	v_item record;
	v_product products;
	v_quantity integer;
	v_reserved_quantity integer;
	v_subtotal bigint := 0;
	v_deposit_total bigint := 0;
	v_line_total bigint;
	v_line_deposit bigint;
	v_items jsonb := '[]'::jsonb;
begin

	if p_klant is null or btrim(p_klant) = '' then
		raise exception 'Vul je naam in.';
	end if;

	if p_email is null or btrim(p_email) = '' then
		raise exception 'Vul een geldig e-mailadres in.';
	end if;

	if p_telefoon is null or btrim(p_telefoon) = '' then
		raise exception 'Vul je telefoonnummer in.';
	end if;

	if p_start_date is null or p_end_date is null or p_start_date > p_end_date then
		raise exception 'Kies een geldige periode.';
	end if;

	if p_producten is null or jsonb_array_length(p_producten) = 0 then
		raise exception 'Kies minstens één product.';
	end if;

	v_aantal_dagen := (p_end_date - p_start_date) + 1;

	-- Aggregate by productId first so repeated lines for the same product
	-- in one request are summed and checked as a single quantity, instead
	-- of each line independently passing the same stock check.
	for v_item in
		select
			(elem->>'productId')::uuid as product_id,
			sum(greatest(coalesce((elem->>'quantity')::integer, 1), 1))::integer as quantity
		from jsonb_array_elements(p_producten) as elem
		group by (elem->>'productId')::uuid
	loop

		select * into v_product
		from products
		where id = v_item.product_id;

		if v_product.id is null then
			raise exception 'Product niet gevonden.';
		end if;

		v_quantity := v_item.quantity;

		-- Serialize concurrent bookings of the same product so two requests
		-- arriving at the same moment can't both pass the check below.
		perform pg_advisory_xact_lock(hashtext(v_product.id::text));

		select coalesce(sum(ri.quantity), 0)
		into v_reserved_quantity
		from reservations r
		join reservation_items ri on ri.reservation_id = r.id
		where ri.product_id = v_product.id
			and r.status in ('aanvraag', 'bevestigd')
			and r.start_date <= p_end_date
			and r.end_date >= p_start_date;

		if v_reserved_quantity + v_quantity > v_product.stock then
			raise exception 'Onvoldoende voorraad voor % in deze periode. Gevraagd: %, reeds gereserveerd: %, totaal beschikbaar: %',
				v_product.name, v_quantity, v_reserved_quantity, v_product.stock;
		end if;

		v_line_total := v_product.price_per_day * v_quantity * v_aantal_dagen;
		v_line_deposit := v_product.deposit * v_quantity;

		v_subtotal := v_subtotal + v_line_total;
		v_deposit_total := v_deposit_total + v_line_deposit;

		v_items := v_items || jsonb_build_object(
			'product_id', v_product.id,
			'product_name', v_product.name,
			'category', v_product.category,
			'quantity', v_quantity,
			'price_per_day', v_product.price_per_day,
			'deposit_per_item', v_product.deposit,
			'line_total', v_line_total,
			'line_deposit', v_line_deposit,
			'active', true
		);

	end loop;

	insert into customers (name, email, phone, street, house_number, postal_code, city, country, active)
	values (
		p_klant,
		p_email,
		p_telefoon,
		p_adres->>'street',
		p_adres->>'houseNumber',
		p_adres->>'postalCode',
		p_adres->>'city',
		p_adres->>'country',
		true
	)
	returning id into v_customer_id;

	insert into reservations (
		customer_id, status, start_date, end_date, remarks,
		subtotal, discount, total, currency, deposit_total, version
	)
	values (
		v_customer_id, 'aanvraag', p_start_date, p_end_date, p_opmerkingen,
		v_subtotal, 0, v_subtotal, 'EUR', v_deposit_total, 1
	)
	returning * into v_reservation;

	insert into reservation_items (
		reservation_id, product_id, product_name, category, quantity,
		price_per_day, deposit_per_item, line_total, line_deposit, active
	)
	select
		v_reservation.id,
		(item->>'product_id')::uuid,
		item->>'product_name',
		item->>'category',
		(item->>'quantity')::integer,
		(item->>'price_per_day')::bigint,
		(item->>'deposit_per_item')::bigint,
		(item->>'line_total')::bigint,
		(item->>'line_deposit')::bigint,
		true
	from jsonb_array_elements(v_items) as item;

	return jsonb_build_object(
		'id', v_reservation.id,
		'access_token', v_reservation.access_token,
		'customer_id', v_reservation.customer_id,
		'status', v_reservation.status,
		'start_date', v_reservation.start_date,
		'end_date', v_reservation.end_date,
		'remarks', v_reservation.remarks,
		'subtotal', v_reservation.subtotal,
		'discount', v_reservation.discount,
		'total', v_reservation.total,
		'currency', v_reservation.currency,
		'deposit_total', v_reservation.deposit_total,
		'deposit_status', v_reservation.deposit_status,
		'version', v_reservation.version,
		'created_at', v_reservation.created_at,
		'updated_at', v_reservation.updated_at,
		'customers', jsonb_build_object(
			'id', v_customer_id,
			'name', p_klant,
			'email', p_email,
			'phone', p_telefoon
		),
		'reservation_items', v_items
	);

end;
$$;

revoke all on function create_reservation(text, text, text, jsonb, date, date, text, jsonb) from public;
grant execute on function create_reservation(text, text, text, jsonb, date, date, text, jsonb) to anon;
