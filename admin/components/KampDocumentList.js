import { escapeHtml } from "../../src/shared/helpers.js";


export class KampDocumentList {


	constructor(
		container,
		onDelete = null,
		onReorder = null
	) {

		this.container = container;
		this.onDelete = onDelete;
		this.onReorder = onReorder;

	}




	render(documents) {


		if (!documents || documents.length === 0) {

			this.container.innerHTML = `
				<div class="card">
					<p>Geen documenten gevonden.</p>
				</div>
			`;

			return;

		}


		const sorted =
			[...documents].sort((a, b) => a.volgorde - b.volgorde);


		const list = document.createElement("div");
		list.className = "nav-manager-list";


		sorted.forEach((doc, index) => {

			const row = document.createElement("article");

			row.className = "post-manager-card nav-manager-row";
			row.dataset.id = doc.id;


			row.innerHTML = `

				<div class="product-manager-header">

					<div>
						<h3>${escapeHtml(doc.titel)}</h3>
					</div>

					<a class="ghost-button" href="${escapeHtml(doc.bestandUrl)}" target="_blank" rel="noopener">
						Bekijk bestand
					</a>

				</div>

				<div class="product-manager-actions">

					<button type="button" class="ghost-button move-up-btn" ${index === 0 ? "disabled" : ""}>
						&uarr; Omhoog
					</button>

					<button type="button" class="ghost-button move-down-btn" ${index === sorted.length - 1 ? "disabled" : ""}>
						&darr; Omlaag
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




	_attachEvents(documents) {


		this.container
			.querySelectorAll(".move-up-btn")
			.forEach((button, index) => {

				button.addEventListener("click", async () => {

					if (index === 0) {
						return;
					}

					if (this.onReorder) {

						await this.onReorder(documents[index], documents[index - 1]);

					}

				});

			});


		this.container
			.querySelectorAll(".move-down-btn")
			.forEach((button, index) => {

				button.addEventListener("click", async () => {

					if (index === documents.length - 1) {
						return;
					}

					if (this.onReorder) {

						await this.onReorder(documents[index], documents[index + 1]);

					}

				});

			});


		this.container
			.querySelectorAll(".delete-btn")
			.forEach(button => {

				button.addEventListener("click", async () => {

					const row = button.closest(".nav-manager-row");
					const id = row.dataset.id;
					const doc = documents.find(entry => entry.id === id);

					const confirmed = confirm(

						`Weet je zeker dat je "${doc?.titel ?? "dit document"}" wilt verwijderen?`

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
							"Document verwijderen mislukt:",
							error
						);

						alert(`Kon document niet verwijderen: ${error.message}`);

						button.disabled = false;

					}

				});

			});

	}

}
