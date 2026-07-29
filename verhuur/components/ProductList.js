import { escapeHtml } from "../../src/shared/helpers.js";
import { AvailabilityCalendar } from "./AvailabilityCalendar.js";


const STATUS_LABELS = {
	beschikbaar: "Beschikbaar",
	"onder voorbehoud": "Beperkt beschikbaar",
	verhuurd: "Niet beschikbaar",
};


function statusModifier(status) {

	return String(status ?? "")
		.replace(/\s+/g, "-");

}


export class ProductList {

	constructor(container, onAdd, onLoadAvailability) {
		this.container = container;
		this.onAdd = onAdd;
		this.onLoadAvailability = onLoadAvailability;
		this.modal = this._createModal();
	}




	_createModal() {

		const overlay = document.createElement("div");

		overlay.className = "modal-overlay";
		overlay.hidden = true;

		overlay.innerHTML = `
			<div class="modal-box">
				<div class="modal-header">
					<h3 class="modal-title"></h3>
					<button type="button" class="modal-close" aria-label="Sluiten">&times;</button>
				</div>
				<div class="modal-body"></div>
			</div>
		`;

		overlay.addEventListener("click", event => {

			if (event.target === overlay) {

				this._closeModal();

			}

		});

		overlay.querySelector(".modal-close")
			.addEventListener("click", () => {

				this._closeModal();

			});

		document.addEventListener("keydown", event => {

			if (event.key === "Escape" && !overlay.hidden) {

				this._closeModal();

			}

		});

		document.body.appendChild(overlay);

		return overlay;

	}




	_openModal(title) {

		this.modal.querySelector(".modal-title").textContent = title;
		this.modal.hidden = false;

	}




	_closeModal() {

		this.modal.hidden = true;
		this.modal.querySelector(".modal-body").innerHTML = "";

	}




	render(products) {

		this.container.innerHTML = "";

		if (products.length === 0) {

			this.container.innerHTML = `
				<div class="empty-state">
					<h3>Geen materiaal gevonden</h3>
					<p>Pas je filters aan om ander materiaal te zien.</p>
				</div>
			`;

			return;

		}

		const list = document.createElement("div");
		list.className = "product-list";

		products.forEach(product => {

			const card = document.createElement("article");

			card.className = "card product-card";


			const beschikbaar =
				product.beschikbaarheid.beschikbaarAantal > 0;

			const modifier =
				statusModifier(product.beschikbaarheid.status);

			const statusLabel =
				STATUS_LABELS[product.beschikbaarheid.status] ?? product.beschikbaarheid.status;

			const fotoAantal =
				product.afbeeldingen?.length ?? 0;


			card.innerHTML = `

				<div class="product-media" aria-hidden="true">
					${escapeHtml((product.categorie || product.naam || "?").charAt(0).toUpperCase())}
				</div>

				<div class="product-body">

					<div class="product-header">
						<div>
							<p class="product-category">${escapeHtml(product.categorie ?? "")}</p>
							<h3>${escapeHtml(product.naam)}</h3>
						</div>
						<span class="status-pill status-pill--${modifier}">${escapeHtml(statusLabel)}</span>
					</div>

					<p class="product-description">${escapeHtml(product.beschrijving ?? "")}</p>

					<div class="product-meta">
						<span>€ ${(product.prijsPerDag / 100).toFixed(2)} per dag</span>
						<span>Waarborg € ${(product.waarborg / 100).toFixed(2)}</span>
						<span>${product.beschikbaarheid.beschikbaarAantal} beschikbaar</span>
					</div>

					<div class="product-actions">
						<button class="add-product ghost-button" ${beschikbaar ? "" : "disabled"}>
							Toevoegen
						</button>
						<button type="button" class="calendar-toggle ghost-button ghost-button--outline">
							Bekijk beschikbaarheid
						</button>
						${fotoAantal > 0
							? `
								<button type="button" class="photo-gallery-toggle ghost-button ghost-button--outline">
									Bekijk foto's (${fotoAantal})
								</button>
							`
							: ""
						}
					</div>

				</div>

			`;


			card.querySelector(".add-product")
				.addEventListener("click", () => {

					this.onAdd(product);

				});


			card.querySelector(".calendar-toggle")
				.addEventListener("click", async () => {

					await this._openCalendar(product);

				});


			card.querySelector(".photo-gallery-toggle")
				?.addEventListener("click", () => {

					this._openPhotoGallery(product);

				});


			list.appendChild(card);

		});

		this.container.appendChild(list);

	}




	async _openCalendar(product) {

		this._openModal(`Beschikbaarheid — ${product.naam}`);

		const body =
			this.modal.querySelector(".modal-body");

		body.innerHTML = `<p class="muted">Beschikbaarheid laden...</p>`;

		try {

			const availabilityData =
				await this.onLoadAvailability(product.id);

			body.innerHTML = "";

			const calendar =
				new AvailabilityCalendar(body, availabilityData);

			calendar.render();

		}
		catch (error) {

			console.error(
				"Fout bij laden beschikbaarheidskalender:",
				error
			);

			body.innerHTML = `<p class="error-message">Kalender kon niet geladen worden.</p>`;

		}

	}




	_openPhotoGallery(product) {

		this._openModal(`Foto's — ${product.naam}`);

		const body =
			this.modal.querySelector(".modal-body");

		body.innerHTML = `
			<div class="photo-gallery-grid">
				${product.afbeeldingen.map(url => `
					<a href="${escapeHtml(url)}" target="_blank" rel="noopener">
						<img src="${escapeHtml(url)}" alt="${escapeHtml(product.naam)}">
					</a>
				`).join("")}
			</div>
		`;

	}

}
