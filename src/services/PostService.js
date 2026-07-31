import { isNonEmptyString } from '../shared/validators.js';
import { repositories } from '../repositories/container.js';

/**
 * Business rules for posts.
 */
export class PostService {
	constructor(posts = repositories.posts) {
		this.posts = posts;
	}

	/**
	 * For the public site: published posts for one page.
	 * @param {string} [page]
	 * @returns {Promise<Array<Object>>}
	 */
	async getAll(page = 'home') {
		const posts = await this.posts.getAll(page);
		return posts.map((post) => post.toJSON());
	}

	/**
	 * For admin post management: every post, including drafts. Pass a page
	 * to filter, or omit it to see every page's posts together.
	 * @param {string} [page]
	 * @returns {Promise<Array<Object>>}
	 */
	async getAllForAdmin(page = null) {
		const posts = await this.posts.getAllForAdmin(page);
		return posts.map((post) => post.toJSON());
	}

	/**
	 * @param {Object} input
	 * @returns {Promise<Object>}
	 */
	async create(input) {
		this._validate(input);
		const post = await this.posts.create(input);
		return post.toJSON();
	}

	/**
	 * @param {string} id
	 * @param {Object} input
	 * @returns {Promise<Object>}
	 */
	async update(id, input) {
		this._validate(input);
		const post = await this.posts.update(id, input);
		return post.toJSON();
	}

	/**
	 * @param {string} id
	 * @returns {Promise<boolean>}
	 */
	async delete(id) {
		return this.posts.delete(id);
	}

	/**
	 * @param {Object} input
	 */
	_validate(input) {
		if (!isNonEmptyString(input.titel)) {
			throw new Error('Vul een titel in.');
		}

		if (!isNonEmptyString(input.inhoud)) {
			throw new Error('Vul inhoud voor de post in.');
		}
	}
}

export const postService = new PostService();
