import { fotoAlbumService }
from "../../src/services/FotoAlbumService.js";

import { escapeHtml }
from "../../src/shared/helpers.js";


function renderAlbum(album) {

	const inner = `
		<img style="width: 300px; height: 200px" src="${escapeHtml(album.coverAfbeeldingUrl)}" alt="Album ${escapeHtml(album.titel)}" class="img-thumbnail">
		<h5 class="text-center">${escapeHtml(album.titel)}</h5>
	`;

	return `
		<div class="col-6 col-md-6 col-lg-3 mb-4">
			${album.link
				? `<a href="${escapeHtml(album.link)}" target="_blank" rel="noopener">${inner}</a>`
				: inner
			}
		</div>
	`;

}


async function loadFotoAlbums() {

	const container =
		document.getElementById("foto-albums-list");

	if (!container) {
		return;
	}


	try {

		const albums =
			await fotoAlbumService.getAll();


		if (!albums || albums.length === 0) {

			container.innerHTML = `<p class="text-muted">Nog geen albums beschikbaar.</p>`;

			return;

		}


		container.innerHTML =
			albums.map(renderAlbum).join("");

	}
	catch (error) {

		console.error(
			"Kon fotoalbums niet laden:",
			error
		);

		container.innerHTML = `<p class="text-muted">Kon fotoalbums niet laden.</p>`;

	}

}


loadFotoAlbums();
