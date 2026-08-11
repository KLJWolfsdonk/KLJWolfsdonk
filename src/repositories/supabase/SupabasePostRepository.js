import { Post } from '../../models/Post.js';
import { supabase } from '../../shared/supabase.js';


function mapPost(row) {

	return Post.from({

		id: row.id,

		titel: row.title,

		inhoud: row.content,

		coverAfbeelding: row.cover_image,

		coverAfbeeldingBreedte: row.cover_image_width ?? 100,

		volgorde: row.sort_order ?? 0,

		pagina: row.page ?? 'home',

		gepubliceerd: row.published ?? false,

		datum: row.post_date,

		auteurEmail: row.author_email,

		createdAt: row.created_at,

		updatedAt: row.updated_at

	});

}


function mapToDatabase(post) {
	return {
		title: post.titel,
		content: post.inhoud,
		cover_image: post.coverAfbeelding ?? null,
		cover_image_width: post.coverAfbeeldingBreedte ?? 100,
		sort_order: post.volgorde ?? 0,
		page: post.pagina ?? 'home',
		published: post.gepubliceerd ?? false,
		post_date: post.datum,
		author_email: post.auteurEmail
	};
}


export class SupabasePostRepository {


	/**
	 * For the public site: published posts for one page, in the
	 * admin-defined order.
	 */
	async getAll(page = 'home') {

		const { data, error } = await supabase
			.from('posts')
			.select('*')
			.eq('published', true)
			.eq('page', page)
			.order('sort_order');


		if (error) {
			throw error;
		}


		return data.map(mapPost);
	}



	/**
	 * For admin post management: every post regardless of published state,
	 * so drafts can be found and finished later. Pass a page to filter the
	 * admin list, or omit it to see every page's posts together.
	 */
	async getAllForAdmin(page = null) {

		let query = supabase
			.from('posts')
			.select('*')
			.order('sort_order');

		if (page) {
			query = query.eq('page', page);
		}

		const { data, error } = await query;


		if (error) {
			throw error;
		}


		return data.map(mapPost);
	}



	async getById(id) {

		const { data, error } = await supabase
			.from('posts')
			.select('*')
			.eq('id', id)
			.single();


		if (error) {
			return null;
		}


		return mapPost(data);
	}



	async create(entity) {

		const { data: { user } } = await supabase.auth.getUser();

		// New posts default to the top of their page's feed (lower
		// sort_order = shown first), regardless of post_date, so a
		// freshly-written post is immediately visible without the admin
		// having to reorder it up. Scoped per page — each page's feed has
		// its own independent ordering.
		const { data: lowestOrderRow } = await supabase
			.from('posts')
			.select('sort_order')
			.eq('page', entity.pagina ?? 'home')
			.order('sort_order')
			.limit(1)
			.maybeSingle();

		const nextSortOrder = (lowestOrderRow?.sort_order ?? 0) - 10;

		const databasePost = {
			...mapToDatabase(entity),
			author_email: user?.email ?? 'onbekend',
			sort_order: nextSortOrder
		};


		const { data, error } = await supabase
			.from('posts')
			.insert(databasePost)
			.select()
			.single();


		if (error) {
			throw error;
		}


		return mapPost(data);
	}



	async update(id, entity) {

		const databasePost = {
			...mapToDatabase(entity),
			updated_at: new Date().toISOString()
		};


		const { data, error } = await supabase
			.from('posts')
			.update(databasePost)
			.eq('id', id)
			.select()
			.single();


		if (error) {
			throw error;
		}


		return mapPost(data);
	}



	async delete(id) {

		const { error } = await supabase
			.from('posts')
			.delete()
			.eq('id', id);


		if (error) {
			throw error;
		}


		return true;
	}

}
