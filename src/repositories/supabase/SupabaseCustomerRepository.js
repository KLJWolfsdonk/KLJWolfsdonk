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

		const { data, error } = await supabase
			.from('customers')
			.insert({
				name: customer.naam,
				email: customer.email,
				phone: customer.telefoon,

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
			active: true
		});
	}

}