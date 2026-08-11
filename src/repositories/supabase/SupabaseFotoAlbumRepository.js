import { supabase } from '../../shared/supabase.js';


function mapAlbum(row) {

	return {

		id: row.id,

		titel: row.titel,

		coverAfbeeldingUrl: row.cover_image_url,

		link: row.link,

		volgorde: row.sort_order ?? 0

	};

}


export class SupabaseFotoAlbumRepository {


	async getAll() {

		const { data, error } = await supabase
			.from('foto_albums')
			.select('*')
			.order('sort_order');


		if (error) {
			throw error;
		}


		return data.map(mapAlbum);
	}



	async create(entity) {

		const { data: highestOrderRow } = await supabase
			.from('foto_albums')
			.select('sort_order')
			.order('sort_order', { ascending: false })
			.limit(1)
			.maybeSingle();

		const nextSortOrder = (highestOrderRow?.sort_order ?? 0) + 10;


		const { data, error } = await supabase
			.from('foto_albums')
			.insert({
				titel: entity.titel,
				cover_image_url: entity.coverAfbeeldingUrl,
				link: entity.link ?? null,
				sort_order: nextSortOrder
			})
			.select()
			.single();


		if (error) {
			throw error;
		}


		return mapAlbum(data);
	}



	async update(id, entity) {

		const { data, error } = await supabase
			.from('foto_albums')
			.update({
				titel: entity.titel,
				cover_image_url: entity.coverAfbeeldingUrl,
				link: entity.link ?? null,
				sort_order: entity.volgorde ?? 0
			})
			.eq('id', id)
			.select()
			.single();


		if (error) {
			throw error;
		}


		return mapAlbum(data);
	}



	async delete(id) {

		const { error } = await supabase
			.from('foto_albums')
			.delete()
			.eq('id', id);


		if (error) {
			throw error;
		}


		return true;
	}

}
