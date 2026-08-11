import { escapeHtml }
from "../../src/shared/helpers.js";


/**
 * Renders an address + embedded Google Maps iframe into `container`, using
 * the plain-address embed format (?q=<address>&output=embed) — no API key
 * needed. Shared by every page that shows the clubhouse location (Over's
 * "Praktisch" tab, Contact) so the address only lives in one place
 * (site_settings).
 */
export function renderAddressMap(container, address) {

	if (!container) {
		return;
	}


	if (!address) {

		container.innerHTML = `<p class="text-muted">Er is nog geen locatie ingesteld.</p>`;

		return;

	}


	const mapSrc =
		`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;

	container.innerHTML = `
		<p>${escapeHtml(address)}</p>
		<iframe
			width="100%"
			height="400"
			src="${mapSrc}"
			style="border:0;"
			allowfullscreen=""
			loading="lazy"
			referrerpolicy="no-referrer-when-downgrade"
		></iframe>
	`;

}
