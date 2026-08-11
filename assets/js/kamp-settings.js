import { kampService }
from "../../src/services/KampService.js";

import { toEmbedUrl }
from "../../src/shared/videoEmbed.js";

import { escapeHtml }
from "../../src/shared/helpers.js";

import { loadPosts }
from "./posts-feed.js";

import { renderAddressMap }
from "./siteMap.js";




function renderDescription(container, beschrijving) {

	if (!beschrijving) {

		container.innerHTML = "";

		return;

	}

	container.innerHTML = `<p>${escapeHtml(beschrijving).replace(/\n/g, "<br>")}</p>`;

}




function renderRegistrationLink(container, inschrijvingsLink) {

	if (!inschrijvingsLink) {

		container.innerHTML = `<p class="text-muted">Er is nog geen inschrijvingslink ingesteld.</p>`;

		return;

	}

	container.innerHTML = `
		<p>
			Je kan je inschrijven voor het kamp via
			<a href="${escapeHtml(inschrijvingsLink)}" target="_blank" rel="noopener noreferrer">deze link!</a>
		</p>
	`;

}




function renderAftermovie(container, aftermovieUrl) {

	if (!aftermovieUrl) {

		container.innerHTML = `<p class="text-muted">Er is nog geen aftermovie ingesteld.</p>`;

		return;

	}


	const embedUrl =
		toEmbedUrl(aftermovieUrl);


	if (!embedUrl) {

		container.innerHTML = `
			<p>
				<a href="${escapeHtml(aftermovieUrl)}" target="_blank" rel="noopener">
					Bekijk de aftermovie
				</a>
			</p>
		`;

		return;

	}


	container.innerHTML = `
		<iframe
			width="100%"
			height="315"
			src="${escapeHtml(embedUrl)}"
			title="Aftermovie"
			frameborder="0"
			allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
			allowfullscreen
		></iframe>
	`;

}




async function loadKampSettings() {

	const descriptionContainer =
		document.getElementById("kamp-description");

	const registrationContainer =
		document.getElementById("kamp-registration-link");

	const aftermovieContainer =
		document.getElementById("kamp-aftermovie");

	const mapContainer =
		document.getElementById("kamp-map");


	try {

		const settings =
			await kampService.getSettings();

		if (descriptionContainer) {
			renderDescription(descriptionContainer, settings.beschrijving);
		}

		if (registrationContainer) {
			renderRegistrationLink(registrationContainer, settings.inschrijvingsLink);
		}

		if (aftermovieContainer) {
			renderAftermovie(aftermovieContainer, settings.aftermovieUrl);
		}

		if (mapContainer) {
			renderAddressMap(mapContainer, settings.locatieAdres);
		}

	}
	catch (error) {

		console.error(
			"Kon kampinstellingen niet laden:",
			error
		);

		if (descriptionContainer) {
			descriptionContainer.innerHTML = `<p class="text-muted">Kon beschrijving niet laden.</p>`;
		}

		if (registrationContainer) {
			registrationContainer.innerHTML = `<p class="text-muted">Kon inschrijvingslink niet laden.</p>`;
		}

		if (aftermovieContainer) {
			aftermovieContainer.innerHTML = `<p class="text-muted">Kon aftermovie niet laden.</p>`;
		}

		if (mapContainer) {
			mapContainer.innerHTML = `<p class="text-muted">Kon locatie niet laden.</p>`;
		}

	}

}


loadKampSettings();

loadPosts("kamp-posts-list", "kamp");
