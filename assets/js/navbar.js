import { navigationService }
from "../../src/services/NavigationService.js";

import { escapeHtml }
from "../../src/shared/helpers.js";


async function renderNavbar() {

	const list =
		document.getElementById("navbar-nav-list");

	if (!list) {
		return;
	}


	try {

		const items =
			await navigationService.getAll();


		if (!items || items.length === 0) {

			// Keep the hardcoded fallback <li> items already in the HTML —
			// an empty table shouldn't blank out the navbar.
			return;

		}


		const sorted =
			[...items].sort((a, b) => a.volgorde - b.volgorde);


		const currentHash =
			window.location.hash || sorted[0].href;


		list.innerHTML = sorted
			.map(item => {

				const isExternal = !item.href.startsWith("#");
				const isActive = item.href === currentHash;

				return `
					<li class="nav-item${isActive ? " active" : ""}">
						<a
							class="nav-link"
							href="${escapeHtml(item.href)}"
							${isExternal ? 'target="_blank" rel="noopener"' : ""}
						>${escapeHtml(item.label)}</a>
					</li>
				`;

			})
			.join("");

	}
	catch (error) {

		// Leave the hardcoded fallback nav-links in place — the navbar
		// should never go blank just because Supabase is unreachable.
		console.error(
			"Kon navigatie niet laden, val terug op de statische navbar:",
			error
		);

	}

}


renderNavbar();
