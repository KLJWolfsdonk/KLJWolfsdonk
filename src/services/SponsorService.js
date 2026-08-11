import { isNonEmptyString } from '../shared/validators.js';
import { repositories } from '../repositories/container.js';

/**
 * Business rules for the Sponsors page's sponsor list.
 */
export class SponsorService {
	constructor(sponsors = repositories.sponsors) {
		this.sponsors = sponsors;
	}

	/**
	 * @returns {Promise<Array<Object>>}
	 */
	async getAll() {
		return this.sponsors.getAll();
	}

	/**
	 * @param {Object} input
	 * @returns {Promise<Object>}
	 */
	async create(input) {
		this._validate(input);
		return this.sponsors.create(input);
	}

	/**
	 * @param {string} id
	 * @param {Object} input
	 * @returns {Promise<Object>}
	 */
	async update(id, input) {
		this._validate(input);
		return this.sponsors.update(id, input);
	}

	/**
	 * @param {string} id
	 * @returns {Promise<boolean>}
	 */
	async delete(id) {
		return this.sponsors.delete(id);
	}

	/**
	 * @param {Object} input
	 */
	_validate(input) {
		if (!isNonEmptyString(input.naam)) {
			throw new Error('Vul een naam in.');
		}

		if (!isNonEmptyString(input.logoUrl)) {
			throw new Error('Er ontbreekt een logo.');
		}
	}
}

export const sponsorService = new SponsorService();
