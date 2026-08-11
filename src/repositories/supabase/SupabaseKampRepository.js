import { supabase } from '../../shared/supabase.js';


function mapSettings(row) {

	if (!row) {

		return {
			id: null,
			aftermovieUrl: null,
			locatieAdres: null,
			beschrijving: null,
			inschrijvingsLink: null
		};

	}

	return {

		id: row.id,

		aftermovieUrl: row.aftermovie_url,

		locatieAdres: row.location_address,

		beschrijving: row.description,

		inschrijvingsLink: row.registration_url

	};

}


function mapDocument(row) {

	return {

		id: row.id,

		titel: row.title,

		bestandUrl: row.file_url,

		volgorde: row.sort_order ?? 0

	};

}


export class SupabaseKampRepository {


	async getSettings() {

		const { data, error } = await supabase
			.from('kamp_settings')
			.select('*')
			.limit(1)
			.maybeSingle();


		if (error) {
			throw error;
		}


		return mapSettings(data);
	}



	async updateSettings({ aftermovieUrl, locatieAdres, beschrijving, inschrijvingsLink }) {

		const current = await this.getSettings();

		const payload = {
			aftermovie_url: aftermovieUrl ?? null,
			location_address: locatieAdres ?? null,
			description: beschrijving ?? null,
			registration_url: inschrijvingsLink ?? null,
			updated_at: new Date().toISOString()
		};


		// kamp_settings is a one-row table; update it if it exists, insert
		// it if this is somehow the very first save (e.g. the seed insert
		// in sql/kamp_page.sql was skipped).
		if (current.id) {

			const { data, error } = await supabase
				.from('kamp_settings')
				.update(payload)
				.eq('id', current.id)
				.select()
				.single();

			if (error) {
				throw error;
			}

			return mapSettings(data);

		}


		const { data, error } = await supabase
			.from('kamp_settings')
			.insert(payload)
			.select()
			.single();

		if (error) {
			throw error;
		}

		return mapSettings(data);
	}



	async getDocuments() {

		const { data, error } = await supabase
			.from('kamp_documents')
			.select('*')
			.order('sort_order');


		if (error) {
			throw error;
		}


		return data.map(mapDocument);
	}



	async createDocument(entity) {

		const { data: lowestOrderRow } = await supabase
			.from('kamp_documents')
			.select('sort_order')
			.order('sort_order', { ascending: false })
			.limit(1)
			.maybeSingle();

		const nextSortOrder = (lowestOrderRow?.sort_order ?? 0) + 10;

		const { data, error } = await supabase
			.from('kamp_documents')
			.insert({
				title: entity.titel,
				file_url: entity.bestandUrl,
				sort_order: nextSortOrder
			})
			.select()
			.single();


		if (error) {
			throw error;
		}


		return mapDocument(data);
	}



	async updateDocument(id, entity) {

		const { data, error } = await supabase
			.from('kamp_documents')
			.update({
				title: entity.titel,
				file_url: entity.bestandUrl,
				sort_order: entity.volgorde ?? 0
			})
			.eq('id', id)
			.select()
			.single();


		if (error) {
			throw error;
		}


		return mapDocument(data);
	}



	async deleteDocument(id) {

		const { error } = await supabase
			.from('kamp_documents')
			.delete()
			.eq('id', id);


		if (error) {
			throw error;
		}


		return true;
	}

}
