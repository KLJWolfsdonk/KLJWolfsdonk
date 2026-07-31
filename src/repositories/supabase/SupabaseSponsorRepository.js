import { supabase } from '../../shared/supabase.js';


function mapSponsor(row) {

	return {

		id: row.id,

		naam: row.naam,

		logoUrl: row.logo_url,

		link: row.link,

		volgorde: row.sort_order ?? 0

	};

}


export class SupabaseSponsorRepository {


	async getAll() {

		const { data, error } = await supabase
			.from('sponsors')
			.select('*')
			.order('sort_order');


		if (error) {
			throw error;
		}


		return data.map(mapSponsor);
	}



	async create(entity) {

		const { data: highestOrderRow } = await supabase
			.from('sponsors')
			.select('sort_order')
			.order('sort_order', { ascending: false })
			.limit(1)
			.maybeSingle();

		const nextSortOrder = (highestOrderRow?.sort_order ?? 0) + 10;


		const { data, error } = await supabase
			.from('sponsors')
			.insert({
				naam: entity.naam,
				logo_url: entity.logoUrl,
				link: entity.link ?? null,
				sort_order: nextSortOrder
			})
			.select()
			.single();


		if (error) {
			throw error;
		}


		return mapSponsor(data);
	}



	async update(id, entity) {

		const { data, error } = await supabase
			.from('sponsors')
			.update({
				naam: entity.naam,
				logo_url: entity.logoUrl,
				link: entity.link ?? null,
				sort_order: entity.volgorde ?? 0
			})
			.eq('id', id)
			.select()
			.single();


		if (error) {
			throw error;
		}


		return mapSponsor(data);
	}



	async delete(id) {

		const { error } = await supabase
			.from('sponsors')
			.delete()
			.eq('id', id);


		if (error) {
			throw error;
		}


		return true;
	}

}
