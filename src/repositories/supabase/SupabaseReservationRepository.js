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
			telefoon: customer.phone ?? ''
		},


		klant: customer.name ?? '',
		email: customer.email ?? '',
		telefoon: customer.phone ?? '',


		status: row.status,


		startDatum: row.start_date,
		eindDatum: row.end_date,


		opmerkingen: row.remarks,
		adminNotities: row.admin_notes,



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
					phone
				),
				reservation_items!reservation_items_reservation_id_fkey (
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
					phone
				),
				reservation_items!reservation_items_reservation_id_fkey (
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






	async create(reservation) {


		const { data: reservationData, error } = await supabase
			.from('reservations')
			.insert({

				customer_id: reservation.customerId,

				status: reservation.status,


				start_date: reservation.startDatum,

				end_date: reservation.eindDatum,


				remarks: reservation.opmerkingen,

				admin_notes: reservation.adminNotities,



				subtotal: reservation.prijs.subtotaal,

				discount: reservation.prijs.korting,

				total: reservation.prijs.totaal,

				currency: reservation.prijs.valuta,



				deposit_total: reservation.waarborg.totaal,


				version: reservation.versie

			})
			.select('id, created_at, updated_at, version')
			.single();



		if (error) {
			throw error;
		}




		const items =
			reservation.producten.map(product => ({

				reservation_id: reservationData.id,


				product_id: product.productId,


				product_name: product.productNaamSnapshot,

				category: product.categorieSnapshot,


				quantity: product.quantity,


				price_per_day: product.prijsPerDagSnapshot,

				deposit_per_item: product.waarborgPerStukSnapshot,


				line_total: product.linePrijs,

				line_deposit: product.lineWaarborg,


				active: true

			}));




		const { error: itemError } = await supabase
			.from('reservation_items')
			.insert(items);



		if (itemError) {
			throw itemError;
		}



		/*
			Anonymous visitors can't SELECT the full reservations/customers
			rows (RLS), so the confirmation is built from data we already
			know client-side plus the few server-generated fields above,
			instead of re-fetching the row we just created.
		*/
		return mapReservation({

			id: reservationData.id,
			customer_id: reservation.customerId,

			status: reservation.status,

			start_date: reservation.startDatum,
			end_date: reservation.eindDatum,

			remarks: reservation.opmerkingen,
			admin_notes: reservation.adminNotities,

			subtotal: reservation.prijs.subtotaal,
			discount: reservation.prijs.korting,
			total: reservation.prijs.totaal,
			currency: reservation.prijs.valuta,

			deposit_total: reservation.waarborg.totaal,
			deposit_status: reservation.waarborg.status,

			version: reservationData.version,
			created_at: reservationData.created_at,
			updated_at: reservationData.updated_at,

			customers: {
				id: reservation.customerId,
				name: reservation.klant,
				email: reservation.email,
				phone: reservation.telefoon
			},

			reservation_items: items

		});

	}




	/**
	 * Lightweight, non-sensitive data for computing public availability:
	 * no customer info, pricing, or admin fields — safe for anonymous reads.
	 */
	async getAllForAvailability() {

		const { data, error } = await supabase
			.from('reservations')
			.select(`
				id,
				status,
				start_date,
				end_date,
				reservation_items!reservation_items_reservation_id_fkey (
					product_id,
					quantity
				)
			`);

		if (error) {
			throw error;
		}

		return data.map(row => ({
			id: row.id,
			status: row.status,
			startDatum: row.start_date,
			eindDatum: row.end_date,
			producten: (row.reservation_items ?? []).map(item => ({
				productId: item.product_id,
				quantity: item.quantity
			}))
		}));

	}






	async update(id, reservation) {


	const { data, error } = await supabase
		.from('reservations')
		.update({

			status: reservation.status,

			start_date: reservation.startDatum,

			end_date: reservation.eindDatum,


			remarks: reservation.opmerkingen,

			admin_notes: reservation.adminNotities,


			payment_status: reservation.betaling?.status ?? 'none',

			paid_at: reservation.betaling?.betaaldAt ?? null,


			version: (reservation.versie ?? 1) + 1

		})
		.eq('id', id)
		.select(`
			*,
			customers (
				id,
				name,
				email,
				phone
			),
			reservation_items!reservation_items_reservation_id_fkey (
				*
			)
		`)
		.single();



	if (error) {

		console.error(
			"SUPABASE UPDATE ERROR",
			error
		);

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
					phone
				),
				reservation_items!reservation_items_reservation_id_fkey (
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