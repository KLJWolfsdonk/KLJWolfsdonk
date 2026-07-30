-- Run in the Supabase SQL Editor, after sql/fix_duplicate_product_quantities.sql.
--
-- WHAT THIS FIXES
-- ----------------
-- The admin "Bewerken" (edit) form lets an admin change a reservation's
-- dates and product/quantity list. SupabaseReservationRepository.update()
-- only ever wrote status/dates/remarks/admin_notes/payment fields to the
-- `reservations` row — it never touched `reservation_items`, so product
-- changes from the edit form were silently discarded (the UI reported
-- success, nothing changed). Worse, date changes WERE persisted, but with
-- zero re-check of overlap/stock: ReservationService.update() always calls
-- _prepareReservation with skipStockCheck:true, and even when not skipped
-- that check only compares against a product's total stock, not against
-- other reservations in the same period — so an admin could freely move a
-- reservation onto dates that are already double-booked.
--
-- This adds a dedicated SECURITY DEFINER RPC, admin-only (authenticated),
-- that mirrors create_reservation()'s validation: it looks up current
-- prices from `products`, takes the same per-product advisory lock, checks
-- the requested quantity against what's already committed by OTHER
-- reservations (explicitly excluding this reservation's own existing
-- items) for the new date range, then replaces this reservation's
-- reservation_items and recomputes its totals — all in one transaction.

create or replace function update_reservation_details(
	p_reservation_id uuid,
	p_start_date date,
	p_end_date date,
	p_producten jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
	v_aantal_dagen integer;
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

	select * into v_reservation
	from reservations
	where id = p_reservation_id;

	if v_reservation.id is null then
		raise exception 'Reservatie niet gevonden.';
	end if;

	if p_start_date is null or p_end_date is null or p_start_date > p_end_date then
		raise exception 'Kies een geldige periode.';
	end if;

	if p_producten is null or jsonb_array_length(p_producten) = 0 then
		raise exception 'Kies minstens één product.';
	end if;

	v_aantal_dagen := (p_end_date - p_start_date) + 1;

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

		perform pg_advisory_xact_lock(hashtext(v_product.id::text));

		-- Everything committed by OTHER reservations overlapping the new
		-- period. This reservation's own current items are excluded via
		-- "r.id <> p_reservation_id" so editing its own quantities/dates
		-- doesn't count against itself.
		select coalesce(sum(ri.quantity), 0)
		into v_reserved_quantity
		from reservations r
		join reservation_items ri on ri.reservation_id = r.id
		where ri.product_id = v_product.id
			and r.id <> p_reservation_id
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

	delete from reservation_items where reservation_id = p_reservation_id;

	insert into reservation_items (
		reservation_id, product_id, product_name, category, quantity,
		price_per_day, deposit_per_item, line_total, line_deposit, active
	)
	select
		p_reservation_id,
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

	update reservations
	set start_date = p_start_date,
		end_date = p_end_date,
		subtotal = v_subtotal,
		discount = 0,
		total = v_subtotal,
		deposit_total = v_deposit_total,
		version = version + 1
	where id = p_reservation_id
	returning * into v_reservation;

	return jsonb_build_object(
		'id', v_reservation.id,
		'start_date', v_reservation.start_date,
		'end_date', v_reservation.end_date,
		'subtotal', v_reservation.subtotal,
		'total', v_reservation.total,
		'deposit_total', v_reservation.deposit_total,
		'version', v_reservation.version
	);

end;
$$;

-- Admin-only — same reasoning as every other authenticated-only RPC/table
-- in this project: the admin panel runs as an authenticated Supabase user.
revoke all on function update_reservation_details(uuid, date, date, jsonb) from public;
grant execute on function update_reservation_details(uuid, date, date, jsonb) to authenticated;
