import { isNonEmptyString } from '../shared/validators.js';
import { repositories } from '../repositories/container.js';

/**
 * Business rules for the kamp page's settings and documents.
 */
export class KampService {
	constructor(kamp = repositories.kamp) {
		this.kamp = kamp;
	}

	/**
	 * @returns {Promise<Object>}
	 */
	async getSettings() {
		return this.kamp.getSettings();
	}

	/**
	 * @param {Object} input
	 * @returns {Promise<Object>}
	 */
	async updateSettings(input) {
		return this.kamp.updateSettings(input);
	}

	/**
	 * @returns {Promise<Array<Object>>}
	 */
	async getDocuments() {
		return this.kamp.getDocuments();
	}

	/**
	 * @param {Object} input
	 * @returns {Promise<Object>}
	 */
	async createDocument(input) {
		this._validateDocument(input);
		return this.kamp.createDocument(input);
	}

	/**
	 * @param {string} id
	 * @param {Object} input
	 * @returns {Promise<Object>}
	 */
	async updateDocument(id, input) {
		this._validateDocument(input);
		return this.kamp.updateDocument(id, input);
	}

	/**
	 * @param {string} id
	 * @returns {Promise<boolean>}
	 */
	async deleteDocument(id) {
		return this.kamp.deleteDocument(id);
	}

	/**
	 * @param {Object} input
	 */
	_validateDocument(input) {
		if (!isNonEmptyString(input.titel)) {
			throw new Error('Vul een titel in.');
		}

		if (!isNonEmptyString(input.bestandUrl)) {
			throw new Error('Er ontbreekt een bestand.');
		}
	}
}

export const kampService = new KampService();
