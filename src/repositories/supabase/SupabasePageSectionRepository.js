import { supabase } from '../../shared/supabase.js';


function mapSection(row) {

	return {

		id: row.id,

		page: row.page,

		sectionKey: row.section_key,

		title: row.title,

		content: row.content

	};

}


export class SupabasePageSectionRepository {


	/**
	 * All sections for one page — for public rendering.
	 */
	async getByPage(page) {

		const { data, error } = await supabase
			.from('page_sections')
			.select('*')
			.eq('page', page);


		if (error) {
			throw error;
		}


		return data.map(mapSection);
	}



	async getOne(page, sectionKey) {

		const { data, error } = await supabase
			.from('page_sections')
			.select('*')
			.eq('page', page)
			.eq('section_key', sectionKey)
			.maybeSingle();


		if (error) {
			throw error;
		}


		return data ? mapSection(data) : null;
	}



	/**
	 * Upserts by (page, section_key) — works whether or not the row was
	 * already seeded by the SQL migration.
	 */
	async update(page, sectionKey, { title, content }) {

		const { data, error } = await supabase
			.from('page_sections')
			.upsert(
				{
					page,
					section_key: sectionKey,
					title,
					content,
					updated_at: new Date().toISOString()
				},
				{ onConflict: 'page,section_key' }
			)
			.select()
			.single();


		if (error) {
			throw error;
		}


		return mapSection(data);
	}

}
