import { supabase }
from "../src/shared/supabase.js";

import { reservationService }
from "../src/services/ReservationService.js";


import { ReservationList }
from "./components/ReservationList.js";



const container =
	document.getElementById(
		"reservation-list"
	);



const searchInput =
	document.getElementById(
		"reservation-search"
	);



const filterSelect =
	document.getElementById(
		"reservation-filter"
	);


const logoutButton =
	document.getElementById(
		"logout-button"
	);




let allReservations = [];

let reservationList;




//
// AUTH GATE
//

const { data: { session } } =
	await supabase.auth.getSession();


if (!session) {

	window.location.replace("./login.html" + window.location.search);

}
else {

	logoutButton.hidden = false;

}


supabase.auth.onAuthStateChange((event, newSession) => {

	if (!newSession) {

		window.location.replace("./login.html");

	}

});


logoutButton.addEventListener(
	"click",
	async () => {

		await supabase.auth.signOut();

		window.location.replace("./login.html");

	}
);




async function loadReservations(){


	allReservations =
		await reservationService.getAll();


	renderFiltered();


}





function renderFiltered(){


	const search =
		searchInput.value
		.toLowerCase()
		.trim();



	const status =
		filterSelect.value;




	let filtered =
		allReservations.filter(
			reservation => {


				const searchable =

					JSON.stringify(
						reservation
					)
					.toLowerCase();



				const matchesSearch =
					search === ""
					||
					searchable.includes(search);



				const matchesStatus =
					status === "alle"
					||
					reservation.status === status;



				return (
					matchesSearch &&
					matchesStatus
				);

			}
		);



	reservationList.render(
		filtered
	);


}





reservationList =
	new ReservationList(

		container,


		async (id,status)=>{


			await reservationService.update(
				id,
				{
					status
				}
			);


			await loadReservations();


		},


		async (id) => {


			await reservationService.update(
				id,
				{
					betaling: {
						status: "paid",
						betaaldAt: new Date().toISOString()
					}
				}
			);


			await loadReservations();


		},


		async (id) => {


			await reservationService.delete(id);


			await loadReservations();


		}

	);





searchInput.addEventListener(
	"input",
	renderFiltered
);



filterSelect.addEventListener(
	"change",
	renderFiltered
);




//
// DEEP LINK (?id=<reservationId> from the new-reservation email)
//

const deepLinkId =
	new URLSearchParams(window.location.search).get("id");

if (deepLinkId) {

	searchInput.value = deepLinkId;

}


if (session) {

	loadReservations();

}
