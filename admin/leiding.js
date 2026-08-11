import { leidingService }
from "../src/services/LeidingService.js";

import { guardAdminPage }
from "./authGuard.js";

import { LeidingManagerList }
from "./components/LeidingManagerList.js";

import { uploadLeidingFoto, deleteLeidingFoto }
from "./leidingImages.js";




const logoutButton =
	document.getElementById(
		"logout-button"
	);


const form =
	document.getElementById(
		"groep-form"
	);


const formError =
	document.getElementById(
		"groep-form-error"
	);


const listContainer =
	document.getElementById(
		"leiding-groepen-list"
	);




await guardAdminPage(logoutButton);




let allGroepen = [];


function findGroep(groepId) {

	return allGroepen.find(groep => groep.id === groepId);

}


function findLid(lidId) {

	for (const groep of allGroepen) {

		const lid = groep.leden.find(item => item.id === lidId);

		if (lid) {
			return lid;
		}

	}

	return null;

}




const groepList =
	new LeidingManagerList(

		listContainer,

		{

			onSaveGroep: async (id, { naam }, file) => {

				const current = findGroep(id);

				let groepFotoUrl = current?.groepFotoUrl ?? null;

				if (file) {

					const newUrl = await uploadLeidingFoto(file);

					if (current?.groepFotoUrl) {

						await deleteLeidingFoto(current.groepFotoUrl);

					}

					groepFotoUrl = newUrl;

				}

				await leidingService.updateGroep(id, {
					naam,
					groepFotoUrl,
					volgorde: current?.volgorde ?? 0
				});

				await loadGroepen();

			},


			onDeleteGroep: async id => {

				const current = findGroep(id);

				await leidingService.deleteGroep(id);

				if (current) {

					if (current.groepFotoUrl) {

						await deleteLeidingFoto(current.groepFotoUrl);

					}

					await Promise.all(
						current.leden
							.filter(lid => lid.fotoUrl)
							.map(lid => deleteLeidingFoto(lid.fotoUrl))
					);

				}

				await loadGroepen();

			},


			onReorderGroep: async (item, neighbor) => {

				await Promise.all([

					leidingService.updateGroep(item.id, {
						naam: item.naam,
						groepFotoUrl: item.groepFotoUrl,
						volgorde: neighbor.volgorde
					}),

					leidingService.updateGroep(neighbor.id, {
						naam: neighbor.naam,
						groepFotoUrl: neighbor.groepFotoUrl,
						volgorde: item.volgorde
					})

				]);

				await loadGroepen();

			},


			onSaveLid: async (groepId, lidId, fields, file) => {

				const current = lidId ? findLid(lidId) : null;

				let fotoUrl = current?.fotoUrl ?? null;

				if (file) {

					const newUrl = await uploadLeidingFoto(file);

					if (current?.fotoUrl) {

						await deleteLeidingFoto(current.fotoUrl);

					}

					fotoUrl = newUrl;

				}

				const payload = { ...fields, fotoUrl };

				if (lidId) {

					await leidingService.updateLid(lidId, {
						...payload,
						volgorde: current?.volgorde ?? 0
					});

				}
				else {

					await leidingService.createLid(groepId, payload);

				}

				await loadGroepen();

			},


			onDeleteLid: async id => {

				const current = findLid(id);

				await leidingService.deleteLid(id);

				if (current?.fotoUrl) {

					await deleteLeidingFoto(current.fotoUrl);

				}

				await loadGroepen();

			},


			onReorderLid: async (groepId, item, neighbor) => {

				await Promise.all([

					leidingService.updateLid(item.id, {
						...item,
						volgorde: neighbor.volgorde
					}),

					leidingService.updateLid(neighbor.id, {
						...neighbor,
						volgorde: item.volgorde
					})

				]);

				await loadGroepen();

			}

		}

	);




async function loadGroepen() {

	allGroepen =
		await leidingService.getAll();

	groepList.render(allGroepen);

}




form.addEventListener(
	"submit",
	async event => {

		event.preventDefault();

		formError.hidden = true;


		try {

			const file =
				document.getElementById("new-groep-foto")?.files?.[0];

			const groepFotoUrl =
				file ? await uploadLeidingFoto(file) : null;


			await leidingService.createGroep({

				naam:
					document.getElementById("new-groep-naam").value.trim(),

				groepFotoUrl

			});


			form.reset();


			await loadGroepen();

		}
		catch (error) {

			console.error(
				"Kon groep niet toevoegen:",
				error
			);

			formError.textContent =
				`Kon groep niet toevoegen: ${error.message}`;

			formError.hidden = false;

		}

	}
);




loadGroepen();
