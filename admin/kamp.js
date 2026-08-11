import { kampService }
from "../src/services/KampService.js";

import { guardAdminPage }
from "./authGuard.js";

import { KampDocumentList }
from "./components/KampDocumentList.js";

import { uploadKampDocument, deleteKampDocument }
from "./kampDocuments.js";

import { mountPostsManager }
from "./postsManager.js";




const logoutButton =
	document.getElementById(
		"logout-button"
	);


const settingsForm =
	document.getElementById(
		"settings-form"
	);


const settingsFormError =
	document.getElementById(
		"settings-form-error"
	);


const beschrijvingInput =
	document.getElementById(
		"beschrijving"
	);


const inschrijvingsLinkInput =
	document.getElementById(
		"inschrijvings-link"
	);


const aftermovieUrlInput =
	document.getElementById(
		"aftermovie-url"
	);


const locatieAdresInput =
	document.getElementById(
		"locatie-adres"
	);


const documentForm =
	document.getElementById(
		"document-form"
	);


const documentFormError =
	document.getElementById(
		"document-form-error"
	);


const documentListContainer =
	document.getElementById(
		"kamp-document-list"
	);




await guardAdminPage(logoutButton);




let allDocuments = [];

const documentList =
	new KampDocumentList(

		documentListContainer,


		async id => {

			const current =
				allDocuments.find(
					doc => doc.id === id
				);

			await kampService.deleteDocument(id);

			if (current?.bestandUrl) {

				await deleteKampDocument(current.bestandUrl);

			}

			await loadDocuments();

		},


		async (doc, neighbor) => {

			await Promise.all([

				kampService.updateDocument(doc.id, { ...doc, volgorde: neighbor.volgorde }),

				kampService.updateDocument(neighbor.id, { ...neighbor, volgorde: doc.volgorde })

			]);

			await loadDocuments();

		}

	);




async function loadSettings() {

	const settings =
		await kampService.getSettings();

	beschrijvingInput.value = settings.beschrijving ?? "";
	inschrijvingsLinkInput.value = settings.inschrijvingsLink ?? "";
	aftermovieUrlInput.value = settings.aftermovieUrl ?? "";
	locatieAdresInput.value = settings.locatieAdres ?? "";

}




async function loadDocuments() {

	allDocuments =
		await kampService.getDocuments();

	documentList.render(
		allDocuments
	);

}




settingsForm.addEventListener(
	"submit",
	async event => {


		event.preventDefault();

		settingsFormError.hidden = true;


		try {

			await kampService.updateSettings({

				beschrijving:
					beschrijvingInput.value.trim(),

				inschrijvingsLink:
					inschrijvingsLinkInput.value.trim(),

				aftermovieUrl:
					aftermovieUrlInput.value.trim(),

				locatieAdres:
					locatieAdresInput.value.trim()

			});

		}
		catch (error) {

			console.error(
				"Kon instellingen niet opslaan:",
				error
			);

			settingsFormError.textContent =
				`Kon instellingen niet opslaan: ${error.message}`;

			settingsFormError.hidden = false;

		}

	}
);




documentForm.addEventListener(
	"submit",
	async event => {


		event.preventDefault();

		documentFormError.hidden = true;


		try {

			const file =
				document.getElementById("new-document-bestand")?.files?.[0];

			if (!file) {

				throw new Error("Kies eerst een bestand.");

			}

			const bestandUrl =
				await uploadKampDocument(file);


			await kampService.createDocument({

				titel:
					document.getElementById("new-document-titel").value.trim(),

				bestandUrl

			});


			documentForm.reset();


			await loadDocuments();

		}
		catch (error) {

			console.error(
				"Kon document niet toevoegen:",
				error
			);

			documentFormError.textContent =
				`Kon document niet toevoegen: ${error.message}`;

			documentFormError.hidden = false;

		}

	}
);




loadSettings();
loadDocuments();

mountPostsManager("kamp");
