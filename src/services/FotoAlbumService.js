import { isNonEmptyString } from '../shared/validators.js';
import { repositories } from '../repositories/container.js';

/**
 * Business rules for the Foto's page's photo albums.
 */
export class FotoAlbumService {
	constructor(fotoAlbums = repositories.fotoAlbums) {
		this.fotoAlbums = fotoAlbums;
	}

	/**
	 * @returns {Promise<Array<Object>>}
	 */
	async getAll() {
		return this.fotoAlbums.getAll();
	}

	/**
	 * @param {Object} input
	 * @returns {Promise<Object>}
	 */
	async create(input) {
		this._validate(input);
		return this.fotoAlbums.create(input);
	}

	/**
	 * @param {string} id
	 * @param {Object} input
	 * @returns {Promise<Object>}
	 */
	async update(id, input) {
		this._validate(input);
		return this.fotoAlbums.update(id, input);
	}

	/**
	 * @param {string} id
	 * @returns {Promise<boolean>}
	 */
	async delete(id) {
		return this.fotoAlbums.delete(id);
	}

	/**
	 * @param {Object} input
	 */
	_validate(input) {
		if (!isNonEmptyString(input.titel)) {
			throw new Error('Vul een titel in.');
		}

		if (!isNonEmptyString(input.coverAfbeeldingUrl)) {
			throw new Error('Er ontbreekt een omslagfoto.');
		}
	}
}

export const fotoAlbumService = new FotoAlbumService();
