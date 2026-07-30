import { supabase } from '../../shared/supabase.js';
import { Customer } from '../../models/Customer.js';


function mapCustomer(row) {

	return Customer.from({
		id: row.id,

		naam: row.name,
		email: row.email,
		telefoon: row.phone,

		adres: {
			street: row.street,
			houseNumber: row.house_number,
			postalCode: row.postal_code,
			city: row.city,
			country: row.country
		},

		notities: row.notes,

		actief: row.active,

		createdAt: row.created_at,
		updatedAt: row.updated_at
	});
}


export class SupabaseCustomerRepository {


	async getAll() {

		const { data, error } = await supabase
			.from('customers')
			.select('*');


		if (error) {
			throw error;
		}


		return data.map(mapCustomer);
	}



	async getById(id) {

	const { data, error } = await supabase
		.from('customers')
		.select('*')
		.eq('id', id)
		.single();


	if (error) {
		return null;
	}


	return mapCustomer(data);
}



	async search(query) {

		const q = query.toLowerCase();


		const { data, error } = await supabase
			.from('customers')
			.select('*');


		if (error) {
			throw error;
		}


		return data
			.filter(customer =>
				`${customer.name} ${customer.email}`
					.toLowerCase()
					.includes(q)
			)
			.map(mapCustomer);
	}



	async create(customer) {

		const adres = customer.adres ?? {};

		const { data, error } = await supabase
			.from('customers')
			.insert({
				name: customer.naam,
				email: customer.email,
				phone: customer.telefoon,

				street: adres.street ?? null,
				house_number: adres.houseNumber ?? null,
				postal_code: adres.postalCode ?? null,
				city: adres.city ?? null,
				country: adres.country ?? null,

				active: true
			})
			.select('id')
			.single();


		if (error) {
			throw error;
		}


		/*
			Anonymous visitors can't SELECT customers (RLS), so the
			returned Customer is built from what we already sent plus
			the generated id, instead of re-fetching the row.
		*/
		return mapCustomer({
			id: data.id,
			name: customer.naam,
			email: customer.email,
			phone: customer.telefoon,
			street: adres.street ?? null,
			house_number: adres.houseNumber ?? null,
			postal_code: adres.postalCode ?? null,
			city: adres.city ?? null,
			country: adres.country ?? null,
			active: true
		});
	}



	/**
	 * GDPR data minimization: removes a customer's record once no
	 * reservation references them anymore, so we don't keep personal data
	 * around longer than needed.
	 */
	async deleteIfOrphan(customerId) {

		const { count, error: countError } = await supabase
			.from('reservations')
			.select('id', { count: 'exact', head: true })
			.eq('customer_id', customerId);

		if (countError) {
			throw countError;
		}

		if (count === 0) {

			const { error } = await supabase
				.from('customers')
				.delete()
				.eq('id', customerId);

			if (error) {
				throw error;
			}

		}

	}

}