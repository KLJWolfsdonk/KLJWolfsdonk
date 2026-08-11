import { supabase } from '../../shared/supabase.js';


function mapGroep(row) {

	return {

		id: row.id,

		naam: row.naam,

		groepFotoUrl: row.groep_foto_url,

		volgorde: row.sort_order ?? 0

	};

}



function mapLid(row) {

	return {

		id: row.id,

		groepId: row.groep_id,

		voornaam: row.voornaam,

		achternaam: row.achternaam,

		bijnaam: row.bijnaam,

		geboorte: row.geboorte,

		gsm: row.gsm,

		studie: row.studie,

		werk: row.werk,

		eten: row.eten,

		spel: row.spel,

		taken: row.taken ?? [],

		fotoUrl: row.foto_url,

		volgorde: row.sort_order ?? 0

	};

}


export class SupabaseLeidingRepository {


	async getAllGroepenWithLeden() {

		const { data: groepenRows, error: groepenError } = await supabase
			.from('leiding_groepen')
			.select('*')
			.order('sort_order');

		if (groepenError) {
			throw groepenError;
		}


		const { data: ledenRows, error: ledenError } = await supabase
			.from('leiding_leden')
			.select('*')
			.order('sort_order');

		if (ledenError) {
			throw ledenError;
		}


		const leden = ledenRows.map(mapLid);

		const ledenPerGroep = new Map();

		leden.forEach(lid => {

			const bucket = ledenPerGroep.get(lid.groepId) ?? [];
			bucket.push(lid);
			ledenPerGroep.set(lid.groepId, bucket);

		});


		return groepenRows.map(row => ({

			...mapGroep(row),
			leden: ledenPerGroep.get(row.id) ?? []

		}));

	}




	async createGroep(entity) {

		const { data: highestOrderRow } = await supabase
			.from('leiding_groepen')
			.select('sort_order')
			.order('sort_order', { ascending: false })
			.limit(1)
			.maybeSingle();

		const nextSortOrder = (highestOrderRow?.sort_order ?? 0) + 10;


		const { data, error } = await supabase
			.from('leiding_groepen')
			.insert({
				naam: entity.naam,
				groep_foto_url: entity.groepFotoUrl ?? null,
				sort_order: nextSortOrder
			})
			.select()
			.single();

		if (error) {
			throw error;
		}

		return mapGroep(data);

	}




	async updateGroep(id, entity) {

		const { data, error } = await supabase
			.from('leiding_groepen')
			.update({
				naam: entity.naam,
				groep_foto_url: entity.groepFotoUrl ?? null,
				sort_order: entity.volgorde ?? 0
			})
			.eq('id', id)
			.select()
			.single();

		if (error) {
			throw error;
		}

		return mapGroep(data);

	}




	async deleteGroep(id) {

		const { error } = await supabase
			.from('leiding_groepen')
			.delete()
			.eq('id', id);

		if (error) {
			throw error;
		}

		return true;

	}




	async createLid(groepId, entity) {

		const { data: highestOrderRow } = await supabase
			.from('leiding_leden')
			.select('sort_order')
			.eq('groep_id', groepId)
			.order('sort_order', { ascending: false })
			.limit(1)
			.maybeSingle();

		const nextSortOrder = (highestOrderRow?.sort_order ?? 0) + 10;


		const { data, error } = await supabase
			.from('leiding_leden')
			.insert({
				groep_id: groepId,
				voornaam: entity.voornaam,
				achternaam: entity.achternaam ?? null,
				bijnaam: entity.bijnaam ?? null,
				geboorte: entity.geboorte ?? null,
				gsm: entity.gsm ?? null,
				studie: entity.studie ?? null,
				werk: entity.werk ?? null,
				eten: entity.eten ?? null,
				spel: entity.spel ?? null,
				taken: entity.taken ?? [],
				foto_url: entity.fotoUrl ?? null,
				sort_order: nextSortOrder
			})
			.select()
			.single();

		if (error) {
			throw error;
		}

		return mapLid(data);

	}




	async updateLid(id, entity) {

		const { data, error } = await supabase
			.from('leiding_leden')
			.update({
				voornaam: entity.voornaam,
				achternaam: entity.achternaam ?? null,
				bijnaam: entity.bijnaam ?? null,
				geboorte: entity.geboorte ?? null,
				gsm: entity.gsm ?? null,
				studie: entity.studie ?? null,
				werk: entity.werk ?? null,
				eten: entity.eten ?? null,
				spel: entity.spel ?? null,
				taken: entity.taken ?? [],
				foto_url: entity.fotoUrl ?? null,
				sort_order: entity.volgorde ?? 0
			})
			.eq('id', id)
			.select()
			.single();

		if (error) {
			throw error;
		}

		return mapLid(data);

	}




	async deleteLid(id) {

		const { error } = await supabase
			.from('leiding_leden')
			.delete()
			.eq('id', id);

		if (error) {
			throw error;
		}

		return true;

	}

}
