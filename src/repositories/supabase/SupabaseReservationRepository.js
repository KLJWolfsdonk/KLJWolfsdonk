import { supabase } from '../../shared/supabase.js';
import { Reservation } from '../../models/Reservation.js';


function mapReservation(row) {

	const customer = row.customers ?? {};

	return Reservation.from({

		id: row.id,

		customerId: row.customer_id,


		customerSnapshot: {
			naam: customer.name ?? '',
			email: customer.email ?? '',
			telefoon: customer.phone ?? '',
			adres: {
				street: customer.street ?? '',
				houseNumber: customer.house_number ?? '',
				postalCode: customer.postal_code ?? '',
				city: customer.city ?? '',
				country: customer.country ?? ''
			}
		},


		klant: customer.name ?? '',
		email: customer.email ?? '',
		telefoon: customer.phone ?? '',


		status: row.status,


		startDatum: row.start_date,
		eindDatum: row.end_date,


		opmerkingen: row.remarks,
		adminNotities: row.admin_notes,

		notities:
			(row.reservation_notes ?? [])
				.slice()
				.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
				.map(note => ({
					id: note.id,
					tekst: note.note,
					auteurEmail: note.author_email,
					aangemaaktOp: note.created_at
				})),



		prijs: {
			subtotaal: row.subtotal ?? 0,
			korting: row.discount ?? 0,
			totaal: row.total ?? 0,
			valuta: row.currency ?? 'EUR'
		},



		waarborg: {
			totaal: row.deposit_total ?? 0,
			status: row.deposit_status ?? 'open'
		},



		betaling: {
			status: row.payment_status ?? 'none',
			molliePaymentId: row.mollie_payment_id ?? null,
			checkoutUrl: row.checkout_url ?? null,
			betaaldAt: row.paid_at ?? null
		},



		calendar: {
			status: row.calendar_status ?? 'pending',
			googleCalendarId: row.google_calendar_id ?? null
		},



		contractSignedAt: row.contract_signed_at ?? null,
		contractSignatureData: row.contract_signature_data ?? null,
		contractSnapshot: row.contract_snapshot ?? null,
		accessToken: row.access_token ?? null,



		aangemaaktDoor: row.created_by,
		goedgekeurdDoor: row.approved_by,
		afgehandeldDoor: row.completed_by,


		aangemaaktOp: row.created_at,
		aangepastOp: row.updated_at,


		versie: row.version ?? 1,



		productIds:
			row.reservation_items?.map(item =>
				item.product_id
			) ?? [],



		producten:
			row.reservation_items?.map(item => ({

				productId: item.product_id,

				productNaamSnapshot: item.product_name,

				categorieSnapshot: item.category,

				quantity: item.quantity,

				prijsPerDagSnapshot: item.price_per_day,

				waarborgPerStukSnapshot: item.deposit_per_item,

				linePrijs: item.line_total,

				lineWaarborg: item.line_deposit,

				actief: item.active

			})) ?? []

	});
}




export class SupabaseReservationRepository {



	async getAll() {

		const { data, error } = await supabase
			.from('reservations')
			.select(`
				*,
				customers (
					id,
					name,
					email,
					phone,
					street,
					house_number,
					postal_code,
					city,
					country
				),
				reservation_items!reservation_items_reservation_id_fkey (
					*
				),
				reservation_notes (
					*
				)
			`)
			.order('created_at', {
				ascending: false
			});


		if (error) {
			throw error;
		}



		return data.map(mapReservation);

	}




	async getById(id) {


		const { data, error } = await supabase
			.from('reservations')
			.select(`
				*,
				customers (
					id,
					name,
					email,
					phone,
					street,
					house_number,
					postal_code,
					city,
					country
				),
				reservation_items!reservation_items_reservation_id_fkey (
					*
				),
				reservation_notes (
					*
				)
			`)
			.eq('id', id)
			.single();



		if (error) {
			return null;
		}



		return mapReservation(data);

	}






	/**
	 * Appends a note to the reservation's audit log, stamped with the
	 * currently logged-in admin's email — never overwrites prior notes.
	 */
	async addNote(id, text) {

		const { data: { user } } = await supabase.auth.getUser();

		const { error: insertError } = await supabase
			.from('reservation_notes')
			.insert({
				reservation_id: id,
				author_email: user?.email ?? 'onbekend',
				note: text
			});

		if (insertError) {
			throw insertError;
		}

		return this.getById(id);

	}




	/**
	 * Creates a reservation via the create_reservation() RPC, which looks
	 * up current prices/deposit/stock in `products` itself and computes
	 * every total server-side — the caller can only choose products,
	 * quantities, dates, and contact details, never a price. See
	 * sql/secure_reservation_creation.sql.
	 */
	async create(input) {

		const { data, error } = await supabase
			.rpc('create_reservation', {

				p_klant: input.klant,
				p_email: input.email,
				p_telefoon: input.telefoon,
				p_adres: input.adres ?? {},

				p_start_date: input.startDatum,
				p_end_date: input.eindDatum,

				p_opmerkingen: input.opmerkingen ?? null,

				p_producten:
					(input.producten ?? []).map(item => ({
						productId: item.productId,
						quantity: item.quantity ?? 1
					}))

			});


		if (error) {
			throw error;
		}


		return mapReservation(data);

	}




	/**
	 * Lightweight, non-sensitive data for computing public availability:
	 * no reservation id, customer info, pricing, or admin fields — safe for
	 * anonymous reads. Goes through a SECURITY DEFINER RPC rather than a
	 * direct table select, since anon has no direct SELECT grant on
	 * `reservations`/`reservation_items` (see sql/security_hardening.sql).
	 */
	async getAllForAvailability() {

		const { data, error } = await supabase
			.rpc('get_availability');

		if (error) {
			throw error;
		}

		return (data ?? []).map(row => ({
			status: row.status,
			startDatum: row.startDatum,
			eindDatum: row.eindDatum,
			producten: row.producten ?? []
		}));

	}






	async update(id, reservation) {


	const currentVersion = reservation.versie ?? 1;

	const { data, error } = await supabase
		.from('reservations')
		.update({

			status: reservation.status,


			remarks: reservation.opmerkingen,

			admin_notes: reservation.adminNotities,


			payment_status: reservation.betaling?.status ?? 'none',

			paid_at: reservation.betaling?.betaaldAt ?? null,


			version: currentVersion + 1

		})
		.eq('id', id)
		.eq('version', currentVersion)
		.select(`
			*,
			customers (
				id,
				name,
				email,
				phone,
				street,
				house_number,
				postal_code,
				city,
				country
			),
			reservation_items!reservation_items_reservation_id_fkey (
				*
			),
			reservation_notes (
				*
			)
		`)
		.single();



	if (error) {

		console.error(
			"SUPABASE UPDATE ERROR",
			error
		);

		// PGRST116 = ".single()" matched zero rows, which (since `id` alone
		// would otherwise match exactly one row) means the `version` guard
		// above is what excluded it: someone else updated this reservation
		// first and `reservation.versie` is stale.
		if (error.code === 'PGRST116') {

			throw new Error(
				'Deze reservatie is ondertussen door iemand anders gewijzigd. Herlaad de pagina en probeer opnieuw.'
			);

		}

		throw error;

	}



	return mapReservation(data);

}







	/**
	 * Changes a reservation's dates and/or product lines via the
	 * update_reservation_details() RPC, which re-validates stock/overlap
	 * against every OTHER reservation for the new period and rewrites
	 * reservation_items/totals server-side — see
	 * sql/update_reservation_details.sql. Admin-only (authenticated).
	 */
	async updateDetails(id, { startDatum, eindDatum, producten }) {

		const { error: rpcError } = await supabase
			.rpc('update_reservation_details', {

				p_reservation_id: id,

				p_start_date: startDatum,

				p_end_date: eindDatum,

				p_producten:
					(producten ?? []).map(item => ({
						productId: item.productId,
						quantity: item.quantity ?? 1
					}))

			});

		if (rpcError) {
			throw rpcError;
		}

		return this.getById(id);

	}




	/**
	 * Sets the deposit's status ('open' or 'teruggegeven') — the only field
	 * this touches, no pricing/version implications.
	 */
	async updateDepositStatus(id, status) {

		const { error: updateError } = await supabase
			.from('reservations')
			.update({
				deposit_status: status
			})
			.eq('id', id);

		if (updateError) {
			throw updateError;
		}

		return this.getById(id);

	}




	/**
	 * Clears a placed signature so the renter can sign again (e.g. the wrong
	 * person signed, or a mistake was found afterwards). The reservation's
	 * access_token doesn't change, so their original contract link keeps
	 * working for the new signature.
	 */
	async resetContract(id) {

		const { data, error } = await supabase
			.from('reservations')
			.update({
				contract_signed_at: null,
				contract_signature_data: null,
				contract_snapshot: null
			})
			.eq('id', id)
			.select(`
				*,
				customers (
					id,
					name,
					email,
					phone,
					street,
					house_number,
					postal_code,
					city,
					country
				),
				reservation_items!reservation_items_reservation_id_fkey (
					*
				),
				reservation_notes (
					*
				)
			`)
			.single();

		if (error) {
			throw error;
		}

		return mapReservation(data);

	}




	async delete(id) {


		const { error: itemsError } = await supabase
			.from('reservation_items')
			.delete()
			.eq('reservation_id', id);


		if (itemsError) {
			throw itemsError;
		}



		const { error } = await supabase
			.from('reservations')
			.delete()
			.eq('id', id);



		if (error) {
			throw error;
		}



		return true;

	}







	async search(query) {


		const { data, error } = await supabase
			.from('reservations')
			.select(`
				*,
				customers (
					id,
					name,
					email,
					phone,
					street,
					house_number,
					postal_code,
					city,
					country
				),
				reservation_items!reservation_items_reservation_id_fkey (
					*
				),
				reservation_notes (
					*
				)
			`);




		if (error) {
			throw error;
		}



		const q = query.toLowerCase();




		return data

			.filter(row =>
				JSON.stringify(row)
					.toLowerCase()
					.includes(q)
			)

			.map(mapReservation);

	}


}