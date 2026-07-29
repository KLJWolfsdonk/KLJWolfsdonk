import { Product } from '../../models/Product.js';
import { supabase } from '../../shared/supabase.js';


function mapProduct(row) {

	return Product.from({

		id: row.id,

		naam: row.name,

		categorie: row.category,

		beschrijving: row.description,

		prijsPerDag: row.price_per_day,

		waarborg: row.deposit,

		voorraad: row.stock ?? 0,

		afbeeldingen: row.images ?? [],

		actief: row.active ?? true,

		sortOrder: row.sort_order ?? 0,

		createdAt: row.created_at,

		updatedAt: row.updated_at

	});

}


function mapToDatabase(product) {
	return {
		name: product.naam,
		category: product.categorie,
		description: product.beschrijving,
		price_per_day: product.prijsPerDag,
		deposit: product.waarborg,
		stock: product.voorraad,
		images: product.afbeeldingen ?? [],
		active: product.actief ?? true,
		sort_order: product.sortOrder ?? 0
	};
}


export class SupabaseProductRepository {


	async getAll() {

		const { data, error } = await supabase
			.from('products')
			.select('*')
			.eq('active', true)
			.order('sort_order');


		if (error) {
			throw error;
		}


		return data.map(mapProduct);
	}



	/**
	 * For admin product management: includes deactivated products too, so
	 * staff can find and reactivate them (getAll() only returns active ones).
	 */
	async getAllIncludingInactive() {

		const { data, error } = await supabase
			.from('products')
			.select('*')
			.order('sort_order');


		if (error) {
			throw error;
		}


		return data.map(mapProduct);
	}



	async getById(id) {

		const { data, error } = await supabase
			.from('products')
			.select('*')
			.eq('id', id)
			.single();


		if (error) {
			return null;
		}


		return mapProduct(data);
	}



	async search(query) {

		const search = query.toLowerCase();


		const { data, error } = await supabase
			.from('products')
			.select('*')
			.eq('active', true);


		if (error) {
			throw error;
		}


		return data
			.filter(product => {

				const text = [
					product.name,
					product.category,
					product.description
				]
				.filter(Boolean)
				.join(' ')
				.toLowerCase();


				return text.includes(search);

			})
			.map(mapProduct);
	}



	async create(entity) {

		const databaseProduct = mapToDatabase(entity);


		const { data, error } = await supabase
			.from('products')
			.insert(databaseProduct)
			.select()
			.single();


		if (error) {
			throw error;
		}


		return mapProduct(data);
	}



	async update(id, entity) {

		const databaseProduct = mapToDatabase(entity);


		const { data, error } = await supabase
			.from('products')
			.update(databaseProduct)
			.eq('id', id)
			.select()
			.single();


		if (error) {
			throw error;
		}


		return mapProduct(data);
	}



	async delete(id) {

		const { error } = await supabase
			.from('products')
			.delete()
			.eq('id', id);


		if (error) {
			throw error;
		}


		return true;
	}

    async updateStock(id, stock) {


	const { data, error } =
		await supabase
			.from("products")
			.update({
				stock: stock
			})
			.eq("id", id)
			.select()
			.maybeSingle();



	if (error) {

		console.error(
			"STOCK UPDATE ERROR",
			error
		);

		throw error;

	}



	if (!data) {

		throw new Error(
			`Geen product gevonden voor stock update: ${id}`
		);

	}



	return mapProduct(data);

}

}