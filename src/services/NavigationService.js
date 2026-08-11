import { isNonEmptyString } from '../shared/validators.js';
import { repositories } from '../repositories/container.js';

/**
 * Business rules for navbar items.
 */
export class NavigationService {
	constructor(navigation = repositories.navigation) {
		this.navigation = navigation;
	}

	/**
	 * For the public site: visible items only.
	 * @returns {Promise<Array<Object>>}
	 */
	async getAll() {
		return this.navigation.getAll();
	}

	/**
	 * For the admin navigation manager: every item, including hidden ones.
	 * @returns {Promise<Array<Object>>}
	 */
	async getAllForAdmin() {
		return this.navigation.getAllForAdmin();
	}

	/**
	 * @param {Object} input
	 * @returns {Promise<Object>}
	 */
	async create(input) {
		this._validate(input);
		return this.navigation.create(input);
	}

	/**
	 * @param {string} id
	 * @param {Object} input
	 * @returns {Promise<Object>}
	 */
	async update(id, input) {
		this._validate(input);
		return this.navigation.update(id, input);
	}

	/**
	 * @param {string} id
	 * @returns {Promise<boolean>}
	 */
	async delete(id) {
		return this.navigation.delete(id);
	}

	/**
	 * @param {Object} input
	 */
	_validate(input) {
		if (!isNonEmptyString(input.label)) {
			throw new Error('Vul een label in.');
		}

		if (!isNonEmptyString(input.href)) {
			throw new Error('Vul een link in.');
		}
	}
}

export const navigationService = new NavigationService();
