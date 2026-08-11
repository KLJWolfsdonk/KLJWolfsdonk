import { escapeHtml } from "../../src/shared/helpers.js";


const LID_FIELDS = [
	["voornaam", "Voornaam", true],
	["achternaam", "Achternaam", false],
	["bijnaam", "Bijnaam", false],
	["geboorte", "Geboortedatum", false],
	["gsm", "GSM", false],
	["studie", "Studie", false],
	["werk", "Werk", false],
	["eten", "Lievelingseten", false],
	["spel", "Lievelingsspelletje", false]
];


/**
 * Admin manager for the Leiding page: a reorderable list of groups
 * (tabs on the public site), each with its own reorderable list of
 * members. Two nested edit-in-place levels, callback-driven like the
 * rest of the admin components.
 */
export class LeidingManagerList {


	constructor(
		container,
		{
			onSaveGroep = null,
			onDeleteGroep = null,
			onReorderGroep = null,
			onSaveLid = null,
			onDeleteLid = null,
			onReorderLid = null
		} = {}
	) {

		this.container = container;

		this.onSaveGroep = onSaveGroep;
		this.onDeleteGroep = onDeleteGroep;
		this.onReorderGroep = onReorderGroep;
		this.onSaveLid = onSaveLid;
		this.onDeleteLid = onDeleteLid;
		this.onReorderLid = onReorderLid;

		this.editingGroepId = null;
		this.addingLidGroepId = null;
		this.editingLidId = null;

	}




	render(groepen) {

		this.groepen = groepen ?? [];


		if (this.groepen.length === 0) {

			this.container.innerHTML = `
				<div class="card">
					<p>Nog geen groepen. Voeg hierboven een eerste groep toe.</p>
				</div>
			`;

			return;

		}


		this.container.innerHTML =
			this.groepen.map((groep, index) =>
				this._renderGroepCard(groep, index)
			).join("");


		this._attachEvents();

	}




	_renderGroepCard(groep, index) {

		const isEditing = this.editingGroepId === groep.id;

		return `
			<article class="product-manager-card" data-groep-id="${escapeHtml(groep.id)}">

				${isEditing ? this._renderGroepEditForm(groep) : this._renderGroepDisplay(groep, index)}

				<hr>

				<h4>Leden</h4>

				<div class="nav-manager-list">
					${groep.leden.map((lid, lidIndex) => this._renderLid(groep, lid, lidIndex)).join("")}
				</div>

				${this.addingLidGroepId === groep.id
					? this._renderLidForm(groep.id, null)
					: `<button type="button" class="ghost-button add-lid-btn">+ Lid toevoegen</button>`
				}

			</article>
		`;

	}




	_renderGroepDisplay(groep, index) {

		return `
			${groep.groepFotoUrl
				? `<img class="product-manager-photo" src="${escapeHtml(groep.groepFotoUrl)}" alt="${escapeHtml(groep.naam)}">`
				: ""
			}

			<div class="product-manager-header">
				<h3>${escapeHtml(groep.naam)}</h3>
			</div>

			<div class="product-manager-actions">

				<button type="button" class="ghost-button move-groep-up-btn" ${index === 0 ? "disabled" : ""}>
					&uarr; Omhoog
				</button>

				<button type="button" class="ghost-button move-groep-down-btn" ${index === this.groepen.length - 1 ? "disabled" : ""}>
					&darr; Omlaag
				</button>

				<button type="button" class="ghost-button edit-groep-btn">
					Bewerk
				</button>

				<button type="button" class="ghost-button delete-groep-btn">
					Verwijder
				</button>

			</div>
		`;

	}




	_renderGroepEditForm(groep) {

		return `
			<form class="groep-edit-form">

				<div class="inline-fields">

					<label class="field-group">
						<span>Naam</span>
						<input class="edit-groep-naam" value="${escapeHtml(groep.naam)}" required>
					</label>

					<label class="field-group">
						<span>Groepsfoto vervangen</span>
						<input type="file" class="edit-groep-foto" accept="image/*">
					</label>

				</div>

				<div style="height: 1rem;"></div>

				<p class="edit-form-error error-message" hidden></p>

				<div class="product-manager-actions">

					<button type="submit" class="ghost-button">
						Opslaan
					</button>

					<button type="button" class="ghost-button cancel-groep-edit-btn">
						Annuleren
					</button>

				</div>

			</form>
		`;

	}




	_renderLid(groep, lid, index) {

		if (this.editingLidId === lid.id) {

			return this._renderLidForm(groep.id, lid);

		}


		const titel =
			escapeHtml(lid.voornaam) +
			(lid.bijnaam ? ` (${escapeHtml(lid.bijnaam)})` : "");

		return `
			<article class="post-manager-card nav-manager-row" data-lid-id="${escapeHtml(lid.id)}">

				<div class="product-manager-header">

					${lid.fotoUrl
						? `<img src="${escapeHtml(lid.fotoUrl)}" alt="" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">`
						: ""
					}

					<div>
						<h3>${titel}</h3>
						<p class="muted">${escapeHtml(lid.achternaam ?? "")}</p>
					</div>

				</div>

				<div class="product-manager-actions">

					<button type="button" class="ghost-button move-lid-up-btn" ${index === 0 ? "disabled" : ""}>
						&uarr; Omhoog
					</button>

					<button type="button" class="ghost-button move-lid-down-btn" ${index === groep.leden.length - 1 ? "disabled" : ""}>
						&darr; Omlaag
					</button>

					<button type="button" class="ghost-button edit-lid-btn">
						Bewerk
					</button>

					<button type="button" class="ghost-button delete-lid-btn">
						Verwijder
					</button>

				</div>

			</article>
		`;

	}




	_renderLidForm(groepId, lid) {

		const isNew = !lid;

		return `
			<form class="lid-form" data-groep-id="${escapeHtml(groepId)}" data-lid-id="${lid ? escapeHtml(lid.id) : ""}">

				<div class="inline-fields">
					${LID_FIELDS.map(([key, label, required]) => `
						<label class="field-group">
							<span>${label}</span>
							<input
								class="lid-field-${key}"
								value="${escapeHtml(lid?.[key] ?? "")}"
								${required ? "required" : ""}
							>
						</label>
					`).join("")}
				</div>

				<div style="height: 1rem;"></div>

				<div class="inline-fields">

					<label class="field-group">
						<span>Taken bij KLJ (komma-gescheiden)</span>
						<input class="lid-field-taken" value="${escapeHtml((lid?.taken ?? []).join(", "))}">
					</label>

					<label class="field-group">
						<span>Foto${isNew ? "" : " vervangen"}</span>
						<input type="file" class="lid-field-foto" accept="image/*" ${isNew ? "required" : ""}>
					</label>

				</div>

				<div style="height: 1rem;"></div>

				<p class="edit-form-error error-message" hidden></p>

				<div class="product-manager-actions">

					<button type="submit" class="ghost-button">
						Opslaan
					</button>

					<button type="button" class="ghost-button cancel-lid-edit-btn">
						Annuleren
					</button>

				</div>

			</form>
		`;

	}




	_findGroep(id) {

		return this.groepen.find(groep => groep.id === id);

	}




	_attachEvents() {


		// Groep: reorder / edit / delete

		this.container
			.querySelectorAll(".move-groep-up-btn")
			.forEach((button, index) => {

				button.addEventListener("click", async () => {

					if (index === 0) {
						return;
					}

					if (this.onReorderGroep) {

						await this.onReorderGroep(this.groepen[index], this.groepen[index - 1]);

					}

				});

			});


		this.container
			.querySelectorAll(".move-groep-down-btn")
			.forEach((button, index) => {

				button.addEventListener("click", async () => {

					if (index === this.groepen.length - 1) {
						return;
					}

					if (this.onReorderGroep) {

						await this.onReorderGroep(this.groepen[index], this.groepen[index + 1]);

					}

				});

			});


		this.container
			.querySelectorAll(".edit-groep-btn")
			.forEach(button => {

				button.addEventListener("click", () => {

					this.editingGroepId = button.closest(".product-manager-card").dataset.groepId;
					this.render(this.groepen);

				});

			});


		this.container
			.querySelectorAll(".cancel-groep-edit-btn")
			.forEach(button => {

				button.addEventListener("click", () => {

					this.editingGroepId = null;
					this.render(this.groepen);

				});

			});


		this.container
			.querySelectorAll(".groep-edit-form")
			.forEach(form => {

				form.addEventListener("submit", async event => {

					event.preventDefault();

					const groepId = form.closest(".product-manager-card").dataset.groepId;

					const naam = form.querySelector(".edit-groep-naam").value.trim();
					const file = form.querySelector(".edit-groep-foto")?.files?.[0] ?? null;

					const submitButton = form.querySelector("button[type=submit]");
					const errorBox = form.querySelector(".edit-form-error");

					submitButton.disabled = true;
					errorBox.hidden = true;

					try {

						if (this.onSaveGroep) {

							await this.onSaveGroep(groepId, { naam }, file);

						}

						this.editingGroepId = null;

					}
					catch (error) {

						console.error("Groep opslaan mislukt:", error);

						errorBox.textContent = `Opslaan mislukt: ${error.message}`;
						errorBox.hidden = false;

						submitButton.disabled = false;

					}

				});

			});


		this.container
			.querySelectorAll(".delete-groep-btn")
			.forEach(button => {

				button.addEventListener("click", async () => {

					const groepId = button.closest(".product-manager-card").dataset.groepId;
					const groep = this._findGroep(groepId);

					const confirmed = confirm(
						`Weet je zeker dat je de groep "${groep?.naam ?? "deze groep"}" en al haar leden permanent wilt verwijderen? ` +
						"Dit kan niet ongedaan gemaakt worden."
					);

					if (!confirmed) {
						return;
					}

					button.disabled = true;

					try {

						if (this.onDeleteGroep) {

							await this.onDeleteGroep(groepId);

						}

					}
					catch (error) {

						console.error("Groep verwijderen mislukt:", error);

						alert(`Kon groep niet verwijderen: ${error.message}`);

						button.disabled = false;

					}

				});

			});


		// Lid: add / reorder / edit / delete

		this.container
			.querySelectorAll(".add-lid-btn")
			.forEach(button => {

				button.addEventListener("click", () => {

					this.addingLidGroepId = button.closest(".product-manager-card").dataset.groepId;
					this.editingLidId = null;
					this.render(this.groepen);

				});

			});


		this.container
			.querySelectorAll(".move-lid-up-btn")
			.forEach(button => {

				button.addEventListener("click", async () => {

					const groepId = button.closest(".product-manager-card").dataset.groepId;
					const groep = this._findGroep(groepId);
					const lidId = button.closest(".nav-manager-row").dataset.lidId;
					const index = groep.leden.findIndex(lid => lid.id === lidId);

					if (index <= 0) {
						return;
					}

					if (this.onReorderLid) {

						await this.onReorderLid(groepId, groep.leden[index], groep.leden[index - 1]);

					}

				});

			});


		this.container
			.querySelectorAll(".move-lid-down-btn")
			.forEach(button => {

				button.addEventListener("click", async () => {

					const groepId = button.closest(".product-manager-card").dataset.groepId;
					const groep = this._findGroep(groepId);
					const lidId = button.closest(".nav-manager-row").dataset.lidId;
					const index = groep.leden.findIndex(lid => lid.id === lidId);

					if (index === -1 || index === groep.leden.length - 1) {
						return;
					}

					if (this.onReorderLid) {

						await this.onReorderLid(groepId, groep.leden[index], groep.leden[index + 1]);

					}

				});

			});


		this.container
			.querySelectorAll(".edit-lid-btn")
			.forEach(button => {

				button.addEventListener("click", () => {

					this.editingLidId = button.closest(".nav-manager-row").dataset.lidId;
					this.addingLidGroepId = null;
					this.render(this.groepen);

				});

			});


		this.container
			.querySelectorAll(".cancel-lid-edit-btn")
			.forEach(button => {

				button.addEventListener("click", () => {

					this.editingLidId = null;
					this.addingLidGroepId = null;
					this.render(this.groepen);

				});

			});


		this.container
			.querySelectorAll(".lid-form")
			.forEach(form => {

				form.addEventListener("submit", async event => {

					event.preventDefault();

					const { groepId, lidId } = form.dataset;

					const fields = {};

					LID_FIELDS.forEach(([key]) => {

						const value = form.querySelector(`.lid-field-${key}`).value.trim();
						fields[key] = value === "" ? null : value;

					});

					fields.taken =
						form.querySelector(".lid-field-taken").value
							.split(",")
							.map(taak => taak.trim())
							.filter(Boolean);

					const file = form.querySelector(".lid-field-foto")?.files?.[0] ?? null;

					const submitButton = form.querySelector("button[type=submit]");
					const errorBox = form.querySelector(".edit-form-error");

					submitButton.disabled = true;
					errorBox.hidden = true;

					try {

						if (this.onSaveLid) {

							await this.onSaveLid(groepId, lidId || null, fields, file);

						}

						this.editingLidId = null;
						this.addingLidGroepId = null;

					}
					catch (error) {

						console.error("Lid opslaan mislukt:", error);

						errorBox.textContent = `Opslaan mislukt: ${error.message}`;
						errorBox.hidden = false;

						submitButton.disabled = false;

					}

				});

			});


		this.container
			.querySelectorAll(".delete-lid-btn")
			.forEach(button => {

				button.addEventListener("click", async () => {

					const lidId = button.closest(".nav-manager-row").dataset.lidId;
					const groepId = button.closest(".product-manager-card").dataset.groepId;
					const groep = this._findGroep(groepId);
					const lid = groep?.leden.find(item => item.id === lidId);

					const confirmed = confirm(
						`Weet je zeker dat je "${lid?.voornaam ?? "dit lid"}" wilt verwijderen?`
					);

					if (!confirmed) {
						return;
					}

					button.disabled = true;

					try {

						if (this.onDeleteLid) {

							await this.onDeleteLid(lidId);

						}

					}
					catch (error) {

						console.error("Lid verwijderen mislukt:", error);

						alert(`Kon lid niet verwijderen: ${error.message}`);

						button.disabled = false;

					}

				});

			});

	}

}
