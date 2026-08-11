import { loadPageSections }
from "./page-sections.js";

import { loadPosts }
from "./posts-feed.js";

import { siteSettingsService }
from "../../src/services/SiteSettingsService.js";

import { renderAddressMap }
from "./siteMap.js";




loadPageSections("over", ["klj", "praktisch", "extra"]);

loadPageSections("activiteiten", ["uitleg"]);

loadPageSections("contact", ["intro"]);


loadPosts("activiteiten-posts-list", "activiteiten");




async function loadSiteAddress() {

	const overMap =
		document.getElementById("over-map");

	const contactMap =
		document.getElementById("contact-map");

	if (!overMap && !contactMap) {
		return;
	}


	try {

		const settings =
			await siteSettingsService.getSettings();

		if (overMap) {
			renderAddressMap(overMap, settings.locatieAdres);
		}

		if (contactMap) {
			renderAddressMap(contactMap, settings.locatieAdres);
		}

	}
	catch (error) {

		console.error(
			"Kon locatie niet laden:",
			error
		);

		if (overMap) {
			overMap.innerHTML = `<p class="text-muted">Kon locatie niet laden.</p>`;
		}

		if (contactMap) {
			contactMap.innerHTML = `<p class="text-muted">Kon locatie niet laden.</p>`;
		}

	}

}


loadSiteAddress();
