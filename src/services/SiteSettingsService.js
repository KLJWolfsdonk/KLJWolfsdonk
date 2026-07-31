import { repositories } from '../repositories/container.js';

/**
 * Business rules for site-wide settings shared across pages (currently
 * just the clubhouse address, reused by Over and Contact).
 */
export class SiteSettingsService {
	constructor(siteSettings = repositories.siteSettings) {
		this.siteSettings = siteSettings;
	}

	/**
	 * @returns {Promise<Object>}
	 */
	async getSettings() {
		return this.siteSettings.getSettings();
	}

	/**
	 * @param {Object} input
	 * @returns {Promise<Object>}
	 */
	async updateSettings(input) {
		return this.siteSettings.updateSettings(input);
	}
}

export const siteSettingsService = new SiteSettingsService();
