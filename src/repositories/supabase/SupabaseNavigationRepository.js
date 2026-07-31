import { supabase } from '../../shared/supabase.js';


function mapNavigationItem(row) {

	return {

		id: row.id,

		label: row.label,

		href: row.href,

		volgorde: row.sort_order ?? 0,

		zichtbaar: row.visible ?? true

	};

}


function mapToDatabase(item) {
	return {
		label: item.label,
		href: item.href,
		sort_order: item.volgorde ?? 0,
		visible: item.zichtbaar ?? true
	};
}


export class SupabaseNavigationRepository {


	/**
	 * For the public site: visible items only.
	 */
	async getAll() {

		const { data, error } = await supabase
			.from('navigation_items')
			.select('*')
			.eq('visible', true)
			.order('sort_order');


		if (error) {
			throw error;
		}


		return data.map(mapNavigationItem);
	}



	/**
	 * For the admin navigation manager: every item, including hidden ones.
	 */
	async getAllForAdmin() {

		const { data, error } = await supabase
			.from('navigation_items')
			.select('*')
			.order('sort_order');


		if (error) {
			throw error;
		}


		return data.map(mapNavigationItem);
	}



	async create(entity) {

		const databaseItem = mapToDatabase(entity);


		const { data, error } = await supabase
			.from('navigation_items')
			.insert(databaseItem)
			.select()
			.single();


		if (error) {
			throw error;
		}


		return mapNavigationItem(data);
	}



	async update(id, entity) {

		const databaseItem = {
			...mapToDatabase(entity),
			updated_at: new Date().toISOString()
		};


		const { data, error } = await supabase
			.from('navigation_items')
			.update(databaseItem)
			.eq('id', id)
			.select()
			.single();


		if (error) {
			throw error;
		}


		return mapNavigationItem(data);
	}



	async delete(id) {

		const { error } = await supabase
			.from('navigation_items')
			.delete()
			.eq('id', id);


		if (error) {
			throw error;
		}


		return true;
	}

}
