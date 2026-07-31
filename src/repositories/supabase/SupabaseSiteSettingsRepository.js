import { supabase } from '../../shared/supabase.js';


function mapSettings(row) {

	if (!row) {

		return {
			id: null,
			locatieAdres: null
		};

	}

	return {

		id: row.id,

		locatieAdres: row.location_address

	};

}


export class SupabaseSiteSettingsRepository {


	async getSettings() {

		const { data, error } = await supabase
			.from('site_settings')
			.select('*')
			.limit(1)
			.maybeSingle();


		if (error) {
			throw error;
		}


		return mapSettings(data);
	}



	async updateSettings({ locatieAdres }) {

		const current = await this.getSettings();

		const payload = {
			location_address: locatieAdres ?? null,
			updated_at: new Date().toISOString()
		};


		// site_settings is a one-row table; update it if it exists, insert
		// it if this is somehow the very first save.
		if (current.id) {

			const { data, error } = await supabase
				.from('site_settings')
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
			.from('site_settings')
			.insert(payload)
			.select()
			.single();

		if (error) {
			throw error;
		}

		return mapSettings(data);
	}

}
