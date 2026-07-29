import { Product } from '../../models/Product.js';
import { getCollection, setCollection } from './memoryStore.js';
import { BaseMockRepository } from './baseMockRepository.js';

/**
 * Mock repository for products.
 */
export class ProductRepository extends BaseMockRepository {
	constructor() {
		super('products');
	}

	_getCollection() {
		return getCollection('products');
	}

	_setCollection(items) {
		setCollection('products', items);
	}

	_matchesSearch(item, query) {
		const haystack = [item.naam, item.categorie, item.beschrijving, ...(Array.isArray(item.zoekTokens) ? item.zoekTokens : [])]
			.filter(Boolean)
			.join(' ')
			.toLowerCase();
		return haystack.includes(query);
	}

	/**
	 * @param {Object} data
	 * @returns {Promise<Product>}
	 */
	async create(data) {
		const created = await super.create(Product.from(data).toJSON());
		return Product.from(created);
	}

	/**
	 * @param {string} id
	 * @returns {Promise<Product|null>}
	 */
	async getById(id) {
		const found = await super.getById(id);
		return found ? Product.from(found) : null;
	}

	/**
	 * @returns {Promise<Product[]>}
	 */
	async getAll() {
		const items = await super.getAll();
		return items.map((item) => Product.from(item));
	}

	/**
	 * @returns {Promise<Product[]>}
	 */
	async getAllIncludingInactive() {
		return this.getAll();
	}

	/**
	 * @param {string} id
	 * @param {Object} data
	 * @returns {Promise<Product|null>}
	 */
	async update(id, data) {
		const updated = await super.update(id, data);
		return updated ? Product.from(updated) : null;
	}

	/**
	 * @param {string} query
	 * @returns {Promise<Product[]>}
	 */
	async search(query) {
		const items = await super.search(query);
		return items.map((item) => Product.from(item));
	}
}

export const productRepository = new ProductRepository();
