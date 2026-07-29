import { escapeHtml, formatMoney } from "../../src/shared/helpers.js";


function euroToCents(value) {

	const parsed = parseFloat(value);

	return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;

}


function centsToEuroValue(cents) {

	return (Number(cents ?? 0) / 100).toFixed(2);

}


export class ProductManagerList {


	constructor(
		container,
		onSaveEdit = null,
		onToggleActive = null,
		onDelete = null
	) {

		this.container = container;
		this.onSaveEdit = onSaveEdit;
		this.onToggleActive = onToggleActive;
		this.onDelete = onDelete;

		this.editingId = null;

	}




	render(products) {


		if (!products || products.length === 0) {

			this.container.innerHTML = `
				<div class="card">
					<p>Geen producten gevonden.</p>
				</div>
			`;

			return;

		}


		const list = document.createElement("div");
		list.className = "product-manager-list";


		products.forEach(product => {

			const card = document.createElement("article");

			card.className =
				"product-manager-card" +
				(product.actief ? "" : " is-inactive");

			card.dataset.id = product.id;


			if (this.editingId === product.id) {

				card.innerHTML = this._renderEditForm(product);

			}
			else {

				card.innerHTML = this._renderDisplay(product);

			}


			list.appendChild(card);

		});


		this.container.innerHTML = "";
		this.container.appendChild(list);


		this._attachEvents(products);

	}




	_renderPhoto(product) {

		const photo = product.afbeeldingen?.[0];

		if (!photo) {
			return "";
		}

		return `
			<img
				class="product-manager-photo"
				src="${escapeHtml(photo)}"
				alt="${escapeHtml(product.naam)}"
			>
		`;

	}




	_renderPhotoGallery(product) {

		const photos = product.afbeeldingen ?? [];

		if (photos.length === 0) {
			return "";
		}

		return `
			<div class="photo-thumb-grid">
				${photos.map(url => `
					<div class="photo-thumb" data-url="${escapeHtml(url)}">
						<img src="${escapeHtml(url)}" alt="">
						<button type="button" class="remove-photo-btn" title="Verwijder foto">&times;</button>
					</div>
				`).join("")}
			</div>
		`;

	}




	_renderDisplay(product) {

		return `

			${this._renderPhoto(product)}

			<div class="product-manager-header">

				<div>
					<p class="product-category">${escapeHtml(product.categorie)}</p>
					<h3>${escapeHtml(product.naam)}</h3>
				</div>

				<span class="status ${product.actief ? "bevestigd" : "geweigerd"}">
					${product.actief ? "Actief" : "Inactief"}
				</span>

			</div>

			<p class="product-description">${escapeHtml(product.beschrijving ?? "")}</p>

			<p>
				€ ${(product.prijsPerDag / 100).toFixed(2)} per dag &middot;
				Waarborg ${formatMoney(product.waarborg)} &middot;
				Voorraad ${product.voorraad}
			</p>

			<div class="product-manager-actions">

				<button type="button" class="ghost-button edit-btn">
					Bewerk
				</button>

				<button type="button" class="ghost-button ${product.actief ? "deactivate-btn" : "activate-btn"} toggle-active-btn">
					${product.actief ? "Deactiveren" : "Activeren"}
				</button>

				<button type="button" class="ghost-button delete-btn">
					Verwijder
				</button>

			</div>

		`;

	}




	_renderEditForm(product) {

		return `

			<form class="product-edit-form">

				${this._renderPhotoGallery(product)}

				<label class="field-group">
					<span>Foto's toevoegen</span>
					<input type="file" class="edit-foto" accept="image/*" multiple>
				</label>

				<div style="height: 1rem;"></div>

				<div class="inline-fields">

					<label class="field-group">
						<span>Naam</span>
						<input class="edit-naam" value="${escapeHtml(product.naam)}" required>
					</label>

					<label class="field-group">
						<span>Categorie</span>
						<input class="edit-categorie" value="${escapeHtml(product.categorie)}" required>
					</label>

				</div>

				<div style="height: 1rem;"></div>

				<label class="field-group">
					<span>Beschrijving</span>
					<input class="edit-beschrijving" value="${escapeHtml(product.beschrijving ?? "")}">
				</label>

				<div style="height: 1rem;"></div>

				<div class="inline-fields">

					<label class="field-group">
						<span>Prijs per dag (&euro;)</span>
						<input class="edit-prijs" type="number" min="0" step="0.01" value="${centsToEuroValue(product.prijsPerDag)}" required>
					</label>

					<label class="field-group">
						<span>Waarborg (&euro;)</span>
						<input class="edit-waarborg" type="number" min="0" step="0.01" value="${centsToEuroValue(product.waarborg)}" required>
					</label>

					<label class="field-group">
						<span>Voorraad</span>
						<input class="edit-voorraad" type="number" min="0" step="1" value="${product.voorraad}" required>
					</label>

				</div>

				<div style="height: 1rem;"></div>

				<p class="edit-form-error error-message" hidden></p>

				<div class="product-manager-actions">

					<button type="submit" class="ghost-button">
						Opslaan
					</button>

					<button type="button" class="ghost-button cancel-edit-btn">
						Annuleren
					</button>

				</div>

			</form>

		`;

	}




	_attachEvents(products) {


		this.container
			.querySelectorAll(".edit-btn")
			.forEach(button => {

				button.addEventListener("click", () => {

					this.editingId = button.closest(".product-manager-card").dataset.id;

					this.render(products);

				});

			});


		this.container
			.querySelectorAll(".cancel-edit-btn")
			.forEach(button => {

				button.addEventListener("click", () => {

					this.editingId = null;

					this.render(products);

				});

			});


		this.container
			.querySelectorAll(".remove-photo-btn")
			.forEach(button => {

				button.addEventListener("click", () => {

					button.closest(".photo-thumb").remove();

				});

			});


		this.container
			.querySelectorAll(".product-edit-form")
			.forEach(form => {

				form.addEventListener("submit", async event => {

					event.preventDefault();

					const card = form.closest(".product-manager-card");

					const id = card.dataset.id;


					const changes = {

						naam: form.querySelector(".edit-naam").value.trim(),

						categorie: form.querySelector(".edit-categorie").value.trim(),

						beschrijving: form.querySelector(".edit-beschrijving").value.trim(),

						prijsPerDag: euroToCents(form.querySelector(".edit-prijs").value),

						waarborg: euroToCents(form.querySelector(".edit-waarborg").value),

						voorraad: parseInt(form.querySelector(".edit-voorraad").value, 10) || 0

					};


					const imageFiles =
						Array.from(form.querySelector(".edit-foto").files);

					const keptImageUrls =
						Array.from(form.querySelectorAll(".photo-thumb"))
							.map(thumb => thumb.dataset.url);


					const submitButton = form.querySelector("button[type=submit]");
					const errorBox = form.querySelector(".edit-form-error");

					submitButton.disabled = true;
					errorBox.hidden = true;


					try {

						if (this.onSaveEdit) {

							await this.onSaveEdit(id, changes, imageFiles, keptImageUrls);

						}

						this.editingId = null;

					}
					catch (error) {

						console.error(
							"Product bijwerken mislukt:",
							error
						);

						errorBox.textContent = `Opslaan mislukt: ${error.message}`;

						errorBox.hidden = false;

						submitButton.disabled = false;

					}

				});

			});


		this.container
			.querySelectorAll(".toggle-active-btn")
			.forEach(button => {

				button.addEventListener("click", async () => {

					const card = button.closest(".product-manager-card");

					const id = card.dataset.id;

					const product = products.find(item => item.id === id);

					if (!product) {
						return;
					}


					button.disabled = true;


					try {

						if (this.onToggleActive) {

							await this.onToggleActive(id, !product.actief);

						}

					}
					finally {

						button.disabled = false;

					}

				});

			});


		this.container
			.querySelectorAll(".delete-btn")
			.forEach(button => {

				button.addEventListener("click", async () => {

					const card = button.closest(".product-manager-card");

					const id = card.dataset.id;

					const product = products.find(item => item.id === id);


					const confirmed = confirm(

						`Weet je zeker dat je "${product?.naam ?? "dit product"}" permanent wilt verwijderen? ` +
						"Dit kan niet ongedaan gemaakt worden. Overweeg deactiveren als je het later nog nodig hebt."

					);


					if (!confirmed) {
						return;
					}


					button.disabled = true;


					try {

						if (this.onDelete) {

							await this.onDelete(id);

						}

					}
					catch (error) {

						console.error(
							"Product verwijderen mislukt:",
							error
						);

						alert(`Kon product niet verwijderen: ${error.message}`);

						button.disabled = false;

					}

				});

			});

	}

}
