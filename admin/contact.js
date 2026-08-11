import { siteSettingsService }
from "../src/services/SiteSettingsService.js";

import { guardAdminPage }
from "./authGuard.js";

import { mountPageSection }
from "./pageSectionsManager.js";




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


const locatieAdresInput =
	document.getElementById(
		"locatie-adres"
	);




await guardAdminPage(logoutButton);




async function loadSettings() {

	const settings =
		await siteSettingsService.getSettings();

	locatieAdresInput.value = settings.locatieAdres ?? "";

}




settingsForm.addEventListener(
	"submit",
	async event => {


		event.preventDefault();

		settingsFormError.hidden = true;


		try {

			await siteSettingsService.updateSettings({

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




loadSettings();

mountPageSection("contact", "intro", "intro");
