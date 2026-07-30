-- Run in the Supabase SQL Editor, after sql/security_hardening.sql.
--
-- WHAT THIS FIXES
-- ----------------
-- Even with the anon grants locked down, anon could still INSERT directly
-- into reservations/reservation_items with ANY price/deposit/quantity
-- values it wanted. The "look up the real price" logic lived entirely in
-- browser-side JS (ReservationService) — that only protects people going
-- through our own booking form. Anyone calling the Supabase REST API
-- directly (browser devtools, curl, etc.) could submit a reservation at
-- any price, or for more units than are in stock, completely bypassing
-- that JS.
--
-- This moves the entire booking-creation flow into one SECURITY DEFINER
-- function that looks up the CURRENT price/deposit/stock from the
-- `products` table itself and computes the reservation's totals from
-- that — the client can only choose which products/quantities/dates/
-- contact details it wants, never the price. Anon's direct INSERT grant
-- on customers/reservations/reservation_items is removed entirely;
-- create_reservation() becomes the only way to create a booking.


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
	v_item jsonb;
	v_product products;
	v_quantity integer;
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

	for v_item in select * from jsonb_array_elements(p_producten)
	loop

		select * into v_product
		from products
		where id = (v_item->>'productId')::uuid;

		if v_product.id is null then
			raise exception 'Product niet gevonden.';
		end if;

		v_quantity := greatest(coalesce((v_item->>'quantity')::integer, 1), 1);

		if v_quantity > v_product.stock then
			raise exception 'Onvoldoende voorraad voor %. Gevraagd: %, beschikbaar: %',
				v_product.name, v_quantity, v_product.stock;
		end if;

		v_line_total := v_product.price_per_day * v_quantity * v_aantal_dagen;
		v_line_deposit := v_product.deposit * v_quantity;

		v_subtotal := v_subtotal + (v_product.price_per_day * v_quantity * v_aantal_dagen);
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


-- Anon no longer needs (or gets) direct INSERT — create_reservation() is
-- now the only path. The three INSERT-only policies from
-- security_hardening.sql are no longer needed either.
revoke insert on customers from anon;
revoke insert on reservations from anon;
revoke insert on reservation_items from anon;

drop policy if exists "anon insert customers" on customers;
drop policy if exists "anon insert reservations" on reservations;
drop policy if exists "anon insert reservation_items" on reservation_items;
