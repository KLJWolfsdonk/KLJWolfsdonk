import { sponsorService }
from "../src/services/SponsorService.js";

import { guardAdminPage }
from "./authGuard.js";

import { MediaList }
from "./components/MediaList.js";

import { uploadSponsorLogo, deleteSponsorLogo }
from "./sponsorImages.js";




const logoutButton =
	document.getElementById(
		"logout-button"
	);


const form =
	document.getElementById(
		"sponsor-form"
	);


const formError =
	document.getElementById(
		"sponsor-form-error"
	);


const listContainer =
	document.getElementById(
		"sponsor-list"
	);




await guardAdminPage(logoutButton);




let allSponsors = [];


function toMediaItem(sponsor) {

	return {
		id: sponsor.id,
		naam: sponsor.naam,
		afbeeldingUrl: sponsor.logoUrl,
		link: sponsor.link,
		volgorde: sponsor.volgorde
	};

}




const sponsorList =
	new MediaList(

		listContainer,


		async id => {

			const current =
				allSponsors.find(
					sponsor => sponsor.id === id
				);

			await sponsorService.delete(id);

			if (current?.logoUrl) {

				await deleteSponsorLogo(current.logoUrl);

			}

			await loadSponsors();

		},


		async (item, neighbor) => {

			await Promise.all([

				sponsorService.update(item.id, {
					naam: item.naam,
					logoUrl: item.afbeeldingUrl,
					link: item.link,
					volgorde: neighbor.volgorde
				}),

				sponsorService.update(neighbor.id, {
					naam: neighbor.naam,
					logoUrl: neighbor.afbeeldingUrl,
					link: neighbor.link,
					volgorde: item.volgorde
				})

			]);

			await loadSponsors();

		}

	);




async function loadSponsors() {

	allSponsors =
		await sponsorService.getAll();

	sponsorList.render(
		allSponsors.map(toMediaItem)
	);

}




form.addEventListener(
	"submit",
	async event => {


		event.preventDefault();

		formError.hidden = true;


		try {

			const file =
				document.getElementById("new-sponsor-logo")?.files?.[0];

			if (!file) {

				throw new Error("Kies eerst een logo.");

			}

			const logoUrl =
				await uploadSponsorLogo(file);


			await sponsorService.create({

				naam:
					document.getElementById("new-sponsor-naam").value.trim(),

				logoUrl,

				link:
					document.getElementById("new-sponsor-link").value.trim() || null

			});


			form.reset();


			await loadSponsors();

		}
		catch (error) {

			console.error(
				"Kon sponsor niet toevoegen:",
				error
			);

			formError.textContent =
				`Kon sponsor niet toevoegen: ${error.message}`;

			formError.hidden = false;

		}

	}
);




loadSponsors();
