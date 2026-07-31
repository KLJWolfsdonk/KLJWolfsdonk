import { ProductList }
	from "./components/ProductList.js";

import { BookingPanel }
	from "./components/BookingPanel.js";

import { PeriodFilter }
	from "./components/PeriodFilter.js";

import { CategoryFilter }
	from "./components/CategoryFilter.js";

import { SearchFilter }
	from "./components/SearchFilter.js";


import { productService }
	from "../src/services/ProductService.js";

import { reservationService }
	from "../src/services/ReservationService.js";


import {
	addProduct,
	getProducts,
    clearCart
} from "../src/state/ReservationCart.js";

import {
	isNonEmptyString,
	isValidEmail,
	isValidDateRange,
	isNotInPast
} from "../src/shared/validators.js";

import { normalizeText, toDateInputValue }
	from "../src/shared/helpers.js";

import { notifyAdminsOfNewReservation }
	from "../src/shared/notifications.js";



const today = new Date();

const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);



let selectedPeriod = {

	startDatum: toDateInputValue(today),

	eindDatum: toDateInputValue(tomorrow)

};



let allProducts = [];

let activeCategory = "alle";

let activeSearch = "";



const productContainer =
	document.getElementById(
		"product-list"
	);



const bookingPanel =
	new BookingPanel(
		document.getElementById(
			"booking-panel"
		),
		submitReservation,
		selectedPeriod
	);





//
// PERIODE FILTER
//

const periodFilter =
	new PeriodFilter(

		document.getElementById(
			"period-filter"
		),

		(period) => {


			selectedPeriod = period;

            bookingPanel.period = period;

            loadProducts(period);

            bookingPanel.render();


		}

	);



periodFilter.render();




//
// CATEGORIE FILTER
//

const categoryFilter =
	new CategoryFilter(

		document.getElementById(
			"category-filter"
		),

		(category) => {

			activeCategory = category;

			renderFilteredProducts();

		}

	);



//
// ZOEKFILTER
//

const searchFilter =
	new SearchFilter(

		document.getElementById(
			"search-filter"
		),

		(search) => {

			activeSearch = search;

			renderFilteredProducts();

		}

	);

searchFilter.render();




//
// PRODUCT LIST
//

const productList =
	new ProductList(

		productContainer,

		(product) => {


			addProduct(product);



			bookingPanel.render();


			scrollToBookingPanelOnMobile();


		},

		(productId) => productService.getAvailabilityCalendarData(productId)

	);




//
// SCROLL NAAR "GEKOZEN MATERIAAL" (mobiel)
//

function scrollToBookingPanelOnMobile() {

	const isMobile =
		window.matchMedia("(max-width: 900px)").matches;

	if (!isMobile) {
		return;
	}

	document
		.getElementById("booking-panel")
		.scrollIntoView({ behavior: "smooth", block: "start" });

}




//
// PRODUCTEN LADEN
//

async function loadProducts(period = {}) {


	try {


		allProducts =
			await productService.getAll(
				period
			);


		categoryFilter.setCategories(
			getUniqueCategories(allProducts)
		);


		renderFilteredProducts();


	}
	catch(error) {


		console.error(
			"Fout bij laden producten:",
			error
		);


	}


}



function getUniqueCategories(products) {

	const categories =
		products
			.map(product => product.categorie)
			.filter(Boolean);

	return [...new Set(categories)];

}



function renderFilteredProducts() {


	const search =
		normalizeText(activeSearch);


	const filtered =
		allProducts.filter(product => {


			const matchesCategory =
				activeCategory === "alle" ||
				product.categorie === activeCategory;


			const searchable =
				[product.naam, product.beschrijving, product.categorie]
					.filter(Boolean)
					.join(" ");

			const matchesSearch =
				search === "" ||
				normalizeText(searchable).includes(search);


			return matchesCategory && matchesSearch;

		});


	productList.render(filtered);

}




//
// RESERVATIE VERSTUREN
//

function validateReservationInput(input) {

	const errors = [];


	if (!isNonEmptyString(input.klant)) {

		errors.push("Vul je naam in.");

	}


	if (!isValidEmail(input.email)) {

		errors.push("Vul een geldig e-mailadres in.");

	}


	if (!isNonEmptyString(input.telefoon)) {

		errors.push("Vul je telefoonnummer in.");

	}


	if (
		!isNonEmptyString(input.adres?.street) ||
		!isNonEmptyString(input.adres?.houseNumber) ||
		!isNonEmptyString(input.adres?.postalCode) ||
		!isNonEmptyString(input.adres?.city)
	) {

		errors.push("Vul je volledig adres in (straat, huisnummer, postcode, gemeente).");

	}


	if (!isValidDateRange(input.startDatum, input.eindDatum)) {

		errors.push("Kies een geldige periode (startdatum voor of gelijk aan einddatum).");

	}
	else if (!isNotInPast(input.startDatum)) {

		errors.push("De startdatum mag niet in het verleden liggen.");

	}


	return errors;

}



async function submitReservation() {


	const products =
		getProducts();




	if(products.length === 0) {


		alert(
			"Kies eerst materiaal."
		);


		return;

	}



	const reservation = {



		klant:

			document
				.getElementById(
					"customer-name"
				)
				.value
				.trim(),




		email:

			document
				.getElementById(
					"customer-email"
				)
				.value
				.trim(),




		telefoon:

			document
				.getElementById(
					"customer-phone"
				)
				.value
				.trim(),




		adres: {

			street:
				document
					.getElementById(
						"customer-street"
					)
					.value
					.trim(),

			houseNumber:
				document
					.getElementById(
						"customer-house-number"
					)
					.value
					.trim(),

			postalCode:
				document
					.getElementById(
						"customer-postal-code"
					)
					.value
					.trim(),

			city:
				document
					.getElementById(
						"customer-city"
					)
					.value
					.trim(),

			country: "België"

		},




		startDatum:

			selectedPeriod.startDatum,




		eindDatum:

			selectedPeriod.eindDatum,




		producten:

			products.map(product => ({


				productId:
					product.id,


				quantity:
					product.quantity ?? 1


			})),




		opmerkingen:

			"Online aanvraag"


	};



	const privacyAcknowledged =
		document
			.getElementById("privacy-ack")
			.checked;


	const validationErrors =
		validateReservationInput(reservation);


	if (!privacyAcknowledged) {

		validationErrors.push(
			"Bevestig dat je de privacyverklaring hebt gelezen."
		);

	}


	if (validationErrors.length > 0) {


		alert(
			validationErrors.join("\n")
		);


		return;

	}



	const submitButton =
		document.getElementById("submit-reservation");

	if (submitButton) {
		submitButton.disabled = true;
	}


	try {


		const result =
			await reservationService.create(
				reservation
			);


		const adminLink =
			new URL(
				`../admin/index.html?id=${result.id}`,
				window.location.href
			).toString();

		notifyAdminsOfNewReservation(
			result,
			adminLink
		);


		clearCart();


        showConfirmation(result);
	}
	catch(error) {


		console.error(
			"Reservatie fout:",
			error
		);




		alert(
			error?.message
				? `Reservatie kon niet worden verstuurd: ${error.message}`
				: "Reservatie kon niet worden verstuurd."
		);

		if (submitButton) {
			submitButton.disabled = false;
		}


	}


}

function showConfirmation(reservation) {


	const panel =
		document.getElementById(
			"booking-panel"
		);



	panel.innerHTML = `


		<p class="section-label">Reservatie</p>
		<h2>Bedankt voor je aanvraag!</h2>


		<p>
			Je reservatieaanvraag werd ontvangen.
		</p>


		<p>
			Referentie:
			<strong>
				${reservation.id}
			</strong>
		</p>


		<p>
			We nemen zo snel mogelijk contact met je op.
		</p>


		<button type="button" id="new-reservation" class="ghost-button">
			Nieuwe reservatie
		</button>


	`;



	document
		.getElementById(
			"new-reservation"
		)
		.addEventListener(
			"click",
			() => {

				bookingPanel.render();

			}
		);

}







//
// START
//

bookingPanel.render();

loadProducts(selectedPeriod);
