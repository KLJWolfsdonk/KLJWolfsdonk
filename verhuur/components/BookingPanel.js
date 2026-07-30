import {
	getProducts,
	removeProduct,
	increaseQuantity,
	decreaseQuantity
} from "../../src/state/ReservationCart.js";

import { escapeHtml } from "../../src/shared/helpers.js";


export class BookingPanel {


	constructor(container, onSubmit, period = {}) {

		this.container = container;
		this.onSubmit = onSubmit;
		this.period = period;

	}



	render() {


		const products = getProducts();



		if(products.length === 0) {


			this.container.innerHTML = `

				<p class="section-label">Reservatie</p>
				<h2>Overzicht</h2>

				<div class="empty-state">
					<h3>Nog geen materiaal gekozen</h3>
					<p>Voeg artikelen toe via de lijst hiernaast.</p>
				</div>

			`;


			return;

		}



		const start =
			new Date(this.period.startDatum);



		const end =
			new Date(this.period.eindDatum);



		const aantalDagen =
			this.period.startDatum &&
			this.period.eindDatum
			?
			Math.floor(
				(end - start) /
				(1000 * 60 * 60 * 24)
			) + 1
			:
			1;




		const huurPerDag =
			products.reduce(
				(sum, product) => {

					return sum +
						(
							product.prijsPerDag *
							product.quantity
						);

				},
				0
			);




		const huurTotaal =
			huurPerDag *
			aantalDagen;




		const waarborg =
			products.reduce(
				(sum, product) => {

					return sum +
						(
							product.waarborg *
							product.quantity
						);

				},
				0
			);




		const totaal =
			huurTotaal +
			waarborg;





		this.container.innerHTML = `

			<p class="section-label">Reservatie</p>
			<h2>Gekozen materiaal</h2>

			<ul class="booking-products">

			${products.map(product => `

				<li class="booking-product-row" data-id="${product.id}">

					<strong>
						${escapeHtml(product.naam)}
					</strong>

					<div class="qty-controls">

						<button type="button" class="qty-btn minus" aria-label="Minder">-</button>

						<span>${product.quantity}x</span>

						<button type="button" class="qty-btn plus" aria-label="Meer">+</button>

						<button type="button" class="qty-btn qty-btn--remove remove">Verwijder</button>

					</div>

				</li>

			`).join("")}

			</ul>

			<h3>Prijsberekening</h3>

			<div class="overview-stats">
				<span>Periode: ${this.period.startDatum ?? "?"} tot ${this.period.eindDatum ?? "?"}</span>
				<span>Aantal dagen: ${aantalDagen}</span>
				<span>Huur: € ${(huurTotaal / 100).toFixed(2)}</span>
				<span>Waarborg: € ${(waarborg / 100).toFixed(2)}</span>
			</div>

			<h3>Totaal: € ${(totaal / 100).toFixed(2)}</h3>

			<div class="inline-fields">

				<label class="field-group">
					<span>Naam</span>
					<input id="customer-name">
				</label>

				<label class="field-group">
					<span>E-mail</span>
					<input
						id="customer-email"
						type="email"
					>
				</label>

			</div>

			<div class="inline-fields">

				<label class="field-group">
					<span>Telefoon</span>
					<input id="customer-phone">
				</label>

			</div>

			<div class="inline-fields">

				<label class="field-group">
					<span>Straat</span>
					<input id="customer-street">
				</label>

				<label class="field-group">
					<span>Huisnummer</span>
					<input id="customer-house-number">
				</label>

			</div>

			<div class="inline-fields">

				<label class="field-group">
					<span>Postcode</span>
					<input id="customer-postal-code">
				</label>

				<label class="field-group">
					<span>Gemeente</span>
					<input id="customer-city">
				</label>

			</div>

			<label class="field-group field-group--checkbox">
				<input type="checkbox" id="privacy-ack">
				<span>
					Ik heb de
					<a href="./privacy.html" target="_blank" rel="noopener">privacyverklaring</a>
					gelezen.
				</span>
			</label>

			<button type="button" id="submit-reservation" class="ghost-button">
				Aanvraag versturen
			</button>

		`;



		this.bindEvents();

	}





	bindEvents() {


		this.container
			.querySelectorAll(".plus")
			.forEach(button => {


				button.addEventListener(
					"click",
					event => {

						const id =
							event.target
							.closest("li")
							.dataset.id;


						increaseQuantity(id);


						this.render();

					}
				);


			});





		this.container
			.querySelectorAll(".minus")
			.forEach(button => {


				button.addEventListener(
					"click",
					event => {


						const id =
							event.target
							.closest("li")
							.dataset.id;


						decreaseQuantity(id);


						this.render();

					}
				);


			});





		this.container
			.querySelectorAll(".remove")
			.forEach(button => {


				button.addEventListener(
					"click",
					event => {


						const id =
							event.target
							.closest("li")
							.dataset.id;


						removeProduct(id);


						this.render();

					}
				);


			});





		const submit =
			this.container.querySelector(
				"#submit-reservation"
			);



		if(submit) {

			submit.addEventListener(
				"click",
				() => {

					this.onSubmit();

				}
			);

		}

	}

}
