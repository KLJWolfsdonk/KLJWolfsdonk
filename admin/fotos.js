import { fotoAlbumService }
from "../src/services/FotoAlbumService.js";

import { guardAdminPage }
from "./authGuard.js";

import { MediaList }
from "./components/MediaList.js";

import { uploadFotoAlbumImage, deleteFotoAlbumImage }
from "./fotoAlbumImages.js";




const logoutButton =
	document.getElementById(
		"logout-button"
	);


const form =
	document.getElementById(
		"album-form"
	);


const formError =
	document.getElementById(
		"album-form-error"
	);


const listContainer =
	document.getElementById(
		"album-list"
	);




await guardAdminPage(logoutButton);




let allAlbums = [];


function toMediaItem(album) {

	return {
		id: album.id,
		naam: album.titel,
		afbeeldingUrl: album.coverAfbeeldingUrl,
		link: album.link,
		volgorde: album.volgorde
	};

}




const albumList =
	new MediaList(

		listContainer,


		async id => {

			const current =
				allAlbums.find(
					album => album.id === id
				);

			await fotoAlbumService.delete(id);

			if (current?.coverAfbeeldingUrl) {

				await deleteFotoAlbumImage(current.coverAfbeeldingUrl);

			}

			await loadAlbums();

		},


		async (item, neighbor) => {

			await Promise.all([

				fotoAlbumService.update(item.id, {
					titel: item.naam,
					coverAfbeeldingUrl: item.afbeeldingUrl,
					link: item.link,
					volgorde: neighbor.volgorde
				}),

				fotoAlbumService.update(neighbor.id, {
					titel: neighbor.naam,
					coverAfbeeldingUrl: neighbor.afbeeldingUrl,
					link: neighbor.link,
					volgorde: item.volgorde
				})

			]);

			await loadAlbums();

		}

	);




async function loadAlbums() {

	allAlbums =
		await fotoAlbumService.getAll();

	albumList.render(
		allAlbums.map(toMediaItem)
	);

}




form.addEventListener(
	"submit",
	async event => {


		event.preventDefault();

		formError.hidden = true;


		try {

			const file =
				document.getElementById("new-album-afbeelding")?.files?.[0];

			if (!file) {

				throw new Error("Kies eerst een omslagfoto.");

			}

			const coverAfbeeldingUrl =
				await uploadFotoAlbumImage(file);


			await fotoAlbumService.create({

				titel:
					document.getElementById("new-album-titel").value.trim(),

				coverAfbeeldingUrl,

				link:
					document.getElementById("new-album-link").value.trim() || null

			});


			form.reset();


			await loadAlbums();

		}
		catch (error) {

			console.error(
				"Kon album niet toevoegen:",
				error
			);

			formError.textContent =
				`Kon album niet toevoegen: ${error.message}`;

			formError.hidden = false;

		}

	}
);




loadAlbums();
