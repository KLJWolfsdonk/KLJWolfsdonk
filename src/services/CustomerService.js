import { customerRepository } from '../repositories/mock/CustomerRepository.js';

/**
 * Business rules for customers.
 */
export class CustomerService {
	constructor(customers = customerRepository) {
		this.customers = customers;
	}

	/**
	 * @returns {Promise<Array<import('../models/Customer.js').Customer>>}
	 */
	async getAll() {
		return this.customers.getAll();
	}

	/**
	 * @param {string} id
	 * @returns {Promise<import('../models/Customer.js').Customer|null>}
	 */
	async getById(id) {
		return this.customers.getById(id);
	}

	/**
	 * @param {string} query
	 * @returns {Promise<Array<import('../models/Customer.js').Customer>>}
	 */
	async search(query) {
		return this.customers.search(query);
	}

	/**
	 * @param {Object} input
	 * @returns {Promise<import('../models/Customer.js').Customer>}
	 */
	async create(input) {
		return this.customers.create(input);
	}

	/**
	 * @param {string} id
	 * @param {Object} input
	 * @returns {Promise<import('../models/Customer.js').Customer|null>}
	 */
	async update(id, input) {
		return this.customers.update(id, input);
	}

	/**
	 * @param {string} id
	 * @returns {Promise<boolean>}
	 */
	async delete(id) {
		return this.customers.delete(id);
	}
}

export const customerService = new CustomerService();
