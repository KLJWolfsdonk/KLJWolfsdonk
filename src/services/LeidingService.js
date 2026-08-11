import { isNonEmptyString } from '../shared/validators.js';
import { repositories } from '../repositories/container.js';

/**
 * Business rules for the Leiding page's groups and members.
 */
export class LeidingService {
	constructor(leiding = repositories.leiding) {
		this.leiding = leiding;
	}

	/**
	 * @returns {Promise<Array<Object>>} groups, each with a nested `leden` array.
	 */
	async getAll() {
		return this.leiding.getAllGroepenWithLeden();
	}

	/**
	 * @param {Object} input
	 * @returns {Promise<Object>}
	 */
	async createGroep(input) {
		this._validateGroep(input);
		return this.leiding.createGroep(input);
	}

	/**
	 * @param {string} id
	 * @param {Object} input
	 * @returns {Promise<Object>}
	 */
	async updateGroep(id, input) {
		this._validateGroep(input);
		return this.leiding.updateGroep(id, input);
	}

	/**
	 * @param {string} id
	 * @returns {Promise<boolean>}
	 */
	async deleteGroep(id) {
		return this.leiding.deleteGroep(id);
	}

	/**
	 * @param {string} groepId
	 * @param {Object} input
	 * @returns {Promise<Object>}
	 */
	async createLid(groepId, input) {
		this._validateLid(input);
		return this.leiding.createLid(groepId, input);
	}

	/**
	 * @param {string} id
	 * @param {Object} input
	 * @returns {Promise<Object>}
	 */
	async updateLid(id, input) {
		this._validateLid(input);
		return this.leiding.updateLid(id, input);
	}

	/**
	 * @param {string} id
	 * @returns {Promise<boolean>}
	 */
	async deleteLid(id) {
		return this.leiding.deleteLid(id);
	}

	/**
	 * @param {Object} input
	 */
	_validateGroep(input) {
		if (!isNonEmptyString(input.naam)) {
			throw new Error('Vul een naam in voor de groep.');
		}
	}

	/**
	 * @param {Object} input
	 */
	_validateLid(input) {
		if (!isNonEmptyString(input.voornaam)) {
			throw new Error('Vul een voornaam in.');
		}
	}
}

export const leidingService = new LeidingService();
