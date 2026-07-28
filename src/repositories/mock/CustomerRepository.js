import { Customer } from '../../models/Customer.js';
import { getCollection, setCollection } from './memoryStore.js';
import { BaseMockRepository } from './baseMockRepository.js';

/**
 * Mock repository for customers.
 */
export class CustomerRepository extends BaseMockRepository {
	constructor() {
		super('customers');
	}

	_getCollection() {
		return getCollection('customers');
	}

	_setCollection(items) {
		setCollection('customers', items);
	}

	_matchesSearch(item, query) {
		const address = item.adres ?? {};
		const haystack = [item.naam, item.email, item.telefoon, item.notities, address.straat, address.postcode, address.gemeente]
			.filter(Boolean)
			.join(' ')
			.toLowerCase();
		return haystack.includes(query);
	}

	/**
	 * @param {Object} data
	 * @returns {Promise<Customer>}
	 */
	async create(data) {
		const created = await super.create(Customer.from(data).toJSON());
		return Customer.from(created);
	}

	/**
	 * @param {string} id
	 * @returns {Promise<Customer|null>}
	 */
	async getById(id) {
		const found = await super.getById(id);
		return found ? Customer.from(found) : null;
	}

	/**
	 * @returns {Promise<Customer[]>}
	 */
	async getAll() {
		const items = await super.getAll();
		return items.map((item) => Customer.from(item));
	}

	/**
	 * @param {string} id
	 * @param {Object} data
	 * @returns {Promise<Customer|null>}
	 */
	async update(id, data) {
		const updated = await super.update(id, data);
		return updated ? Customer.from(updated) : null;
	}

	/**
	 * @param {string} query
	 * @returns {Promise<Customer[]>}
	 */
	async search(query) {
		const items = await super.search(query);
		return items.map((item) => Customer.from(item));
	}
}

export const customerRepository = new CustomerRepository();
