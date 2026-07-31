import { isNonEmptyString } from '../shared/validators.js';
import { repositories } from '../repositories/container.js';

/**
 * Business rules for named rich-text page sections.
 */
export class PageSectionService {
	constructor(pageSections = repositories.pageSections) {
		this.pageSections = pageSections;
	}

	/**
	 * @param {string} page
	 * @returns {Promise<Array<Object>>}
	 */
	async getByPage(page) {
		return this.pageSections.getByPage(page);
	}

	/**
	 * @param {string} page
	 * @param {string} sectionKey
	 * @returns {Promise<Object|null>}
	 */
	async getOne(page, sectionKey) {
		return this.pageSections.getOne(page, sectionKey);
	}

	/**
	 * @param {string} page
	 * @param {string} sectionKey
	 * @param {Object} input
	 * @returns {Promise<Object>}
	 */
	async update(page, sectionKey, input) {
		if (!isNonEmptyString(input.content)) {
			throw new Error('Vul inhoud in.');
		}

		return this.pageSections.update(page, sectionKey, input);
	}
}

export const pageSectionService = new PageSectionService();
