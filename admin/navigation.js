import { navigationService }
from "../src/services/NavigationService.js";

import { guardAdminPage }
from "./authGuard.js";

import { NavigationManagerList }
from "./components/NavigationManagerList.js";




const listContainer =
	document.getElementById(
		"nav-manager-list"
	);


const logoutButton =
	document.getElementById(
		"logout-button"
	);


const form =
	document.getElementById(
		"nav-form"
	);


const formError =
	document.getElementById(
		"nav-form-error"
	);




await guardAdminPage(logoutButton);




let allItems = [];

let navList;




async function loadItems() {


	allItems =
		await navigationService.getAllForAdmin();


	navList.render(
		allItems
	);


}




navList =
	new NavigationManagerList(

		listContainer,


		async (id, changes) => {

			const current =
				allItems.find(
					item => item.id === id
				);

			if (!current) {
				return;
			}

			await navigationService.update(
				id,
				{
					...current,
					...changes
				}
			);

			await loadItems();

		},


		async id => {

			await navigationService.delete(id);

			await loadItems();

		},


		async (item, neighbor) => {

			await Promise.all([

				navigationService.update(item.id, { ...item, volgorde: neighbor.volgorde }),

				navigationService.update(neighbor.id, { ...neighbor, volgorde: item.volgorde })

			]);

			await loadItems();

		}

	);




form.addEventListener(
	"submit",
	async event => {


		event.preventDefault();

		formError.hidden = true;


		try {

			const nextVolgorde =
				allItems.length > 0
					? Math.max(...allItems.map(item => item.volgorde)) + 10
					: 10;


			await navigationService.create({

				label:
					document.getElementById("new-label").value.trim(),

				href:
					document.getElementById("new-href").value.trim(),

				zichtbaar:
					document.getElementById("new-visible").checked,

				volgorde:
					nextVolgorde

			});


			form.reset();

			document.getElementById("new-visible").checked = true;


			await loadItems();

		}
		catch (error) {

			console.error(
				"Kon navigatie-item niet toevoegen:",
				error
			);

			formError.textContent =
				`Kon item niet toevoegen: ${error.message}`;

			formError.hidden = false;

		}

	}
);




loadItems();
