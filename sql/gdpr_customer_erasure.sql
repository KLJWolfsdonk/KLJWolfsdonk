-- GDPR helper SQL for the verhuurmodule. Run relevant parts in the
-- Supabase SQL Editor as needed.


-- 1. One-time check: make sure the admin (authenticated) role is allowed
--    to delete customer rows. The reservation-delete feature already
--    relies on an equivalent authenticated-delete policy for
--    reservations/reservation_items; this adds the same for customers,
--    needed for the automatic "delete orphaned customer" cleanup that now
--    runs whenever an admin deletes a reservation. Safe to run even if a
--    similar policy already exists under a different name — Postgres will
--    just report a duplicate policy name error, which you can ignore.
create policy "authenticated can delete customers"
	on customers
	for delete
	to authenticated
	using (true);


-- 2. Manual erasure for an explicit GDPR "recht op verwijdering" request
--    that arrives outside the normal flow (e.g. by e-mail, for a customer
--    whose reservations aren't finished/deletable yet through the admin
--    panel). Replace the e-mail address below and run all three
--    statements together. This permanently deletes the customer and every
--    reservation (and its line items) linked to them — irreversible.
do $$
declare
	target_customer_id uuid;
begin
	select id into target_customer_id
	from customers
	where email = 'REPLACE_WITH_CUSTOMER_EMAIL';

	if target_customer_id is null then
		raise exception 'Geen klant gevonden met dit e-mailadres.';
	end if;

	delete from reservation_items
	where reservation_id in (
		select id from reservations where customer_id = target_customer_id
	);

	delete from reservations
	where customer_id = target_customer_id;

	delete from customers
	where id = target_customer_id;
end $$;
