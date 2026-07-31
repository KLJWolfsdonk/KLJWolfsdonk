import { escapeHtml } from "../../src/shared/helpers.js";


export class NavigationManagerList {


	constructor(
		container,
		onSave = null,
		onDelete = null,
		onReorder = null
	) {

		this.container = container;
		this.onSave = onSave;
		this.onDelete = onDelete;
		this.onReorder = onReorder;

	}




	render(items) {


		if (!items || items.length === 0) {

			this.container.innerHTML = `
				<div class="card">
					<p>Geen navigatie-items gevonden.</p>
				</div>
			`;

			return;

		}


		const sorted =
			[...items].sort((a, b) => a.volgorde - b.volgorde);


		const list = document.createElement("div");
		list.className = "nav-manager-list";


		sorted.forEach((item, index) => {

			const row = document.createElement("article");

			row.className =
				"post-manager-card nav-manager-row" +
				(item.zichtbaar ? "" : " is-inactive");

			row.dataset.id = item.id;


			row.innerHTML = `

				<div class="inline-fields">

					<label class="field-group">
						<span>Label</span>
						<input class="nav-label" value="${escapeHtml(item.label)}" required>
					</label>

					<label class="field-group">
						<span>Link</span>
						<input class="nav-href" value="${escapeHtml(item.href)}" required>
					</label>

					<label class="field-group field-group--checkbox">
						<input type="checkbox" class="nav-visible" ${item.zichtbaar ? "checked" : ""}>
						<span>Zichtbaar</span>
					</label>

				</div>

				<p class="row-error error-message" hidden></p>

				<div class="product-manager-actions">

					<button type="button" class="ghost-button move-up-btn" ${index === 0 ? "disabled" : ""}>
						&uarr; Omhoog
					</button>

					<button type="button" class="ghost-button move-down-btn" ${index === sorted.length - 1 ? "disabled" : ""}>
						&darr; Omlaag
					</button>

					<button type="button" class="ghost-button save-btn">
						Opslaan
					</button>

					<button type="button" class="ghost-button delete-btn">
						Verwijder
					</button>

				</div>

			`;


			list.appendChild(row);

		});


		this.container.innerHTML = "";
		this.container.appendChild(list);


		this._attachEvents(sorted);

	}




	_attachEvents(items) {


		this.container
			.querySelectorAll(".save-btn")
			.forEach(button => {

				button.addEventListener("click", async () => {

					const row = button.closest(".nav-manager-row");
					const id = row.dataset.id;
					const errorBox = row.querySelector(".row-error");

					errorBox.hidden = true;
					button.disabled = true;


					try {

						const changes = {

							label: row.querySelector(".nav-label").value.trim(),

							href: row.querySelector(".nav-href").value.trim(),

							zichtbaar: row.querySelector(".nav-visible").checked

						};


						if (this.onSave) {

							await this.onSave(id, changes);

						}

					}
					catch (error) {

						console.error(
							"Navigatie-item bijwerken mislukt:",
							error
						);

						errorBox.textContent = `Opslaan mislukt: ${error.message}`;
						errorBox.hidden = false;

					}
					finally {

						button.disabled = false;

					}

				});

			});


		this.container
			.querySelectorAll(".move-up-btn")
			.forEach((button, index) => {

				button.addEventListener("click", async () => {

					if (index === 0) {
						return;
					}

					if (this.onReorder) {

						await this.onReorder(items[index], items[index - 1]);

					}

				});

			});


		this.container
			.querySelectorAll(".move-down-btn")
			.forEach((button, index) => {

				button.addEventListener("click", async () => {

					if (index === items.length - 1) {
						return;
					}

					if (this.onReorder) {

						await this.onReorder(items[index], items[index + 1]);

					}

				});

			});


		this.container
			.querySelectorAll(".delete-btn")
			.forEach(button => {

				button.addEventListener("click", async () => {

					const row = button.closest(".nav-manager-row");
					const id = row.dataset.id;
					const item = items.find(entry => entry.id === id);

					const confirmed = confirm(

						`Weet je zeker dat je "${item?.label ?? "dit item"}" wilt verwijderen?`

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
							"Navigatie-item verwijderen mislukt:",
							error
						);

						alert(`Kon item niet verwijderen: ${error.message}`);

						button.disabled = false;

					}

				});

			});

	}

}
