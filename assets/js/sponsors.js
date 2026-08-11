import { sponsorService }
from "../../src/services/SponsorService.js";

import { escapeHtml }
from "../../src/shared/helpers.js";


function renderSponsor(sponsor) {

	const img = `<img src="${escapeHtml(sponsor.logoUrl)}" alt="Logo ${escapeHtml(sponsor.naam)}" style="width: 100%; height: 100%;">`;

	const content =
		sponsor.link
			? `<a href="${escapeHtml(sponsor.link)}" target="_blank" rel="noopener">${img}</a>`
			: img;

	return `<div class="col-6 col-md-6 col-lg-3 mb-4">${content}</div>`;

}


async function loadSponsors() {

	const container =
		document.getElementById("sponsors-list");

	if (!container) {
		return;
	}


	try {

		const sponsors =
			await sponsorService.getAll();


		if (!sponsors || sponsors.length === 0) {

			container.innerHTML = `<p class="text-muted">Nog geen sponsors beschikbaar.</p>`;

			return;

		}


		container.innerHTML =
			sponsors.map(renderSponsor).join("");

	}
	catch (error) {

		console.error(
			"Kon sponsors niet laden:",
			error
		);

		container.innerHTML = `<p class="text-muted">Kon sponsors niet laden.</p>`;

	}

}


loadSponsors();
