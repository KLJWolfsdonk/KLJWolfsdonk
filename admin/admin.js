import { supabase }
from "../src/shared/supabase.js";

import { reservationService }
from "../src/services/ReservationService.js";


import { ReservationList }
from "./components/ReservationList.js";

import { notifyCustomerOfConfirmation }
from "../src/shared/notifications.js";

import { productService }
from "../src/services/ProductService.js";



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



const paymentFilterSelect =
	document.getElementById(
		"reservation-payment-filter"
	);



const contractFilterSelect =
	document.getElementById(
		"reservation-contract-filter"
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




async function loadProducts(){


	const products =
		await productService.getAllForAdmin();


	reservationList.setProducts(products);


}





function renderFiltered(){


	const search =
		searchInput.value
		.toLowerCase()
		.trim();



	const status =
		filterSelect.value;



	const paymentFilter =
		paymentFilterSelect.value;



	const contractFilter =
		contractFilterSelect.value;




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



				const isPaid =
					reservation.betaling?.status === "paid";



				const matchesPayment =
					paymentFilter === "alle"
					||
					(paymentFilter === "betaald" && isPaid)
					||
					(paymentFilter === "niet-betaald" && !isPaid);



				const isSigned =
					Boolean(reservation.contractSignedAt);



				const matchesContract =
					contractFilter === "alle"
					||
					(contractFilter === "getekend" && isSigned)
					||
					(contractFilter === "niet-getekend" && !isSigned);



				return (
					matchesSearch &&
					matchesStatus &&
					matchesPayment &&
					matchesContract
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


		async (id, paid) => {


			await reservationService.update(
				id,
				{
					betaling:
						paid
						?
						{
							status: "paid",
							betaaldAt: new Date().toISOString()
						}
						:
						{
							status: "none",
							betaaldAt: null
						}
				}
			);


			await loadReservations();


		},


		async (id) => {


			await reservationService.delete(id);


			await loadReservations();


		},


		async (id, notes) => {


			await reservationService.addNote(
				id,
				notes
			);


			await loadReservations();


		},


		async (id) => {


			const reservation =
				allReservations.find(
					item => item.id === id
				);

			if (!reservation) {
				return;
			}

			const verstuurd =
				await notifyCustomerOfConfirmation(
					reservation
				);

			if (!verstuurd) {

				throw new Error(
					"E-mail kon niet worden verstuurd (controleer EmailJS-configuratie en e-mailadres)."
				);

			}


		},


		async (id) => {


			await reservationService.resetContract(id);


			await loadReservations();


		},


		async (id, changes) => {


			await reservationService.update(
				id,
				changes
			);


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



paymentFilterSelect.addEventListener(
	"change",
	renderFiltered
);



contractFilterSelect.addEventListener(
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
	loadProducts();

}
