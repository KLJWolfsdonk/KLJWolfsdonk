import { escapeHtml } from "../../src/shared/helpers.js";


/**
 * Generic reorderable list of {id, naam, afbeeldingUrl, link, volgorde}
 * items — used by both the Foto's (albums) and Sponsors admin pages.
 * Callers map their own domain fields (titel/coverAfbeeldingUrl for
 * albums, naam/logoUrl for sponsors) onto this shape before calling
 * render(), and map back in the onDelete/onReorder callbacks.
 */
export class MediaList {


	constructor(
		container,
		onDelete = null,
		onReorder = null
	) {

		this.container = container;
		this.onDelete = onDelete;
		this.onReorder = onReorder;

	}




	render(items) {


		if (!items || items.length === 0) {

			this.container.innerHTML = `
				<div class="card">
					<p>Geen items gevonden.</p>
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

			row.className = "post-manager-card nav-manager-row";
			row.dataset.id = item.id;


			row.innerHTML = `

				<div class="product-manager-header">

					<img
						src="${escapeHtml(item.afbeeldingUrl)}"
						alt=""
						style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;"
					>

					<div>
						<h3>${escapeHtml(item.naam)}</h3>
						${item.link
							? `<a href="${escapeHtml(item.link)}" target="_blank" rel="noopener">${escapeHtml(item.link)}</a>`
							: ""
						}
					</div>

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




	_attachEvents(items) {


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

						`Weet je zeker dat je "${item?.naam ?? "dit item"}" wilt verwijderen?`

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
							"Item verwijderen mislukt:",
							error
						);

						alert(`Kon item niet verwijderen: ${error.message}`);

						button.disabled = false;

					}

				});

			});

	}

}
