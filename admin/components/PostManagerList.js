import { escapeHtml } from "../../src/shared/helpers.js";
import { uploadPostImage, deletePostImages } from "../postImages.js";
import { createRichTextEditor } from "../richTextEditor.js";


function formatDate(datum) {

	if (!datum) {
		return "?";
	}

	const date = new Date(datum);

	if (Number.isNaN(date.getTime())) {
		return datum;
	}

	return date.toLocaleDateString("nl-BE");

}


export class PostManagerList {


	constructor(
		container,
		onSaveEdit = null,
		onTogglePublished = null,
		onDelete = null,
		onReorder = null
	) {

		this.container = container;
		this.onSaveEdit = onSaveEdit;
		this.onTogglePublished = onTogglePublished;
		this.onDelete = onDelete;
		this.onReorder = onReorder;

		this.editingId = null;
		this.editQuill = null;

	}




	render(posts, reorderEnabled = true) {

		this.reorderEnabled = reorderEnabled;


		if (!posts || posts.length === 0) {

			this.container.innerHTML = `
				<div class="card">
					<p>Geen posts gevonden.</p>
				</div>
			`;

			return;

		}


		const list = document.createElement("div");
		list.className = "post-manager-list";


		posts.forEach((post, index) => {

			const card = document.createElement("article");

			card.className =
				"post-manager-card" +
				(post.gepubliceerd ? "" : " is-inactive");

			card.dataset.id = post.id;


			if (this.editingId === post.id) {

				card.innerHTML = this._renderEditForm(post);

			}
			else {

				card.innerHTML = this._renderDisplay(post, index, posts.length);

			}


			list.appendChild(card);

		});


		this.container.innerHTML = "";
		this.container.appendChild(list);


		const editingPost =
			posts.find(post => post.id === this.editingId);

		if (editingPost) {

			this.editQuill =
				createRichTextEditor(
					this.container.querySelector(".edit-inhoud-editor"),
					editingPost.inhoud
				);

		}
		else {

			this.editQuill = null;

		}


		this._attachEvents(posts);

	}




	_renderCoverThumb(post) {

		if (!post.coverAfbeelding) {
			return "";
		}

		return `
			<div class="photo-thumb-grid">
				<div class="photo-thumb" data-url="${escapeHtml(post.coverAfbeelding)}">
					<img src="${escapeHtml(post.coverAfbeelding)}" alt="">
					<button type="button" class="remove-photo-btn" title="Verwijder cover">&times;</button>
				</div>
			</div>
		`;

	}




	_renderDisplay(post, index, total) {

		const preview =
			typeof DOMPurify !== "undefined"
				? DOMPurify.sanitize(post.inhoud)
				: post.inhoud;

		return `

			${post.coverAfbeelding
				? `<img class="product-manager-photo" src="${escapeHtml(post.coverAfbeelding)}" alt="${escapeHtml(post.titel)}">`
				: ""
			}

			<div class="product-manager-header">

				<div>
					<p class="product-category">${escapeHtml(formatDate(post.datum))} &middot; ${post.pagina === "kamp" ? "Kamp" : "Home"}</p>
					<h3>${escapeHtml(post.titel)}</h3>
				</div>

				<span class="status ${post.gepubliceerd ? "bevestigd" : "geweigerd"}">
					${post.gepubliceerd ? "Gepubliceerd" : "Concept"}
				</span>

			</div>

			<div class="post-content-preview">${preview}</div>

			<div class="product-manager-actions">

				${this.reorderEnabled
					? `
						<button type="button" class="ghost-button move-up-btn" ${index === 0 ? "disabled" : ""}>
							&uarr; Omhoog
						</button>

						<button type="button" class="ghost-button move-down-btn" ${index === total - 1 ? "disabled" : ""}>
							&darr; Omlaag
						</button>
					`
					: ""
				}

				<button type="button" class="ghost-button edit-btn">
					Bewerk
				</button>

				<button type="button" class="ghost-button ${post.gepubliceerd ? "deactivate-btn" : "activate-btn"} toggle-published-btn">
					${post.gepubliceerd ? "Naar concept" : "Publiceren"}
				</button>

				<button type="button" class="ghost-button delete-btn">
					Verwijder
				</button>

			</div>

		`;

	}




	_renderEditForm(post) {

		return `

			<form class="post-edit-form">

				${this._renderCoverThumb(post)}

				<div class="inline-fields">

					<label class="field-group">
						<span>Nieuwe cover afbeelding</span>
						<input type="file" class="edit-cover" accept="image/*">
					</label>

					<label class="field-group">
						<span>Grootte afbeelding</span>
						<select class="edit-cover-breedte">
							<option value="33" ${post.coverAfbeeldingBreedte === 33 ? "selected" : ""}>Klein</option>
							<option value="50" ${post.coverAfbeeldingBreedte === 50 ? "selected" : ""}>Middel</option>
							<option value="75" ${post.coverAfbeeldingBreedte === 75 ? "selected" : ""}>Groot</option>
							<option value="100" ${post.coverAfbeeldingBreedte === 100 ? "selected" : ""}>Volledige breedte</option>
						</select>
					</label>

				</div>

				<div style="height: 1rem;"></div>

				<label class="field-group">
					<span>Titel</span>
					<input class="edit-titel" value="${escapeHtml(post.titel)}" required>
				</label>

				<div style="height: 1rem;"></div>

				<div class="inline-fields">

					<label class="field-group">
						<span>Datum</span>
						<input class="edit-datum" type="date" value="${escapeHtml(post.datum ?? "")}" required>
					</label>

					<label class="field-group">
						<span>Pagina</span>
						<select class="edit-pagina">
							<option value="home" ${post.pagina === "home" ? "selected" : ""}>Home</option>
							<option value="kamp" ${post.pagina === "kamp" ? "selected" : ""}>Kamp</option>
						</select>
					</label>

					<label class="field-group field-group--checkbox">
						<input type="checkbox" class="edit-gepubliceerd" ${post.gepubliceerd ? "checked" : ""}>
						<span>Gepubliceerd</span>
					</label>

				</div>

				<div style="height: 1rem;"></div>

				<label class="field-group">
					<span>Inhoud</span>
					<div class="edit-inhoud-editor"></div>
				</label>

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




	_attachEvents(posts) {


		// Captured once per render() pass rather than read as `this.editQuill`
		// at submit time: saving triggers a reload (onSaveEdit -> loadPosts),
		// which re-renders while this.editingId is still set and replaces
		// this.editQuill with a fresh instance for the reopened form — the
		// submit handler below must keep using the exact instance created
		// alongside it, not whatever this.editQuill has become by then.
		const editQuillInstance = this.editQuill;


		this.container
			.querySelectorAll(".edit-btn")
			.forEach(button => {

				button.addEventListener("click", () => {

					this.editingId = button.closest(".post-manager-card").dataset.id;

					this.render(posts);

				});

			});


		this.container
			.querySelectorAll(".cancel-edit-btn")
			.forEach(button => {

				button.addEventListener("click", () => {

					this.editingId = null;

					this.render(posts);

				});

			});


		this.container
			.querySelectorAll(".move-up-btn")
			.forEach(button => {

				button.addEventListener("click", async () => {

					const card = button.closest(".post-manager-card");
					const id = card.dataset.id;
					const index = posts.findIndex(item => item.id === id);

					if (index <= 0) {
						return;
					}

					if (this.onReorder) {

						await this.onReorder(posts[index], posts[index - 1]);

					}

				});

			});


		this.container
			.querySelectorAll(".move-down-btn")
			.forEach(button => {

				button.addEventListener("click", async () => {

					const card = button.closest(".post-manager-card");
					const id = card.dataset.id;
					const index = posts.findIndex(item => item.id === id);

					if (index === -1 || index >= posts.length - 1) {
						return;
					}

					if (this.onReorder) {

						await this.onReorder(posts[index], posts[index + 1]);

					}

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
			.querySelectorAll(".post-edit-form")
			.forEach(form => {

				form.addEventListener("submit", async event => {

					event.preventDefault();

					const card = form.closest(".post-manager-card");
					const id = card.dataset.id;
					const post = posts.find(item => item.id === id);

					const submitButton = form.querySelector("button[type=submit]");
					const errorBox = form.querySelector(".edit-form-error");

					submitButton.disabled = true;
					errorBox.hidden = true;


					try {

						const keptCoverThumb = form.querySelector(".photo-thumb");
						const keptCoverUrl = keptCoverThumb ? keptCoverThumb.dataset.url : null;
						const newCoverFile = form.querySelector(".edit-cover")?.files?.[0];

						const coverAfbeelding =
							newCoverFile
								? await uploadPostImage(newCoverFile)
								: keptCoverUrl;

						const coverAfbeeldingBreedte =
							parseInt(form.querySelector(".edit-cover-breedte").value, 10) || 100;

						const inhoud =
							DOMPurify.sanitize(editQuillInstance.root.innerHTML);

						const changes = {

							titel: form.querySelector(".edit-titel").value.trim(),

							datum: form.querySelector(".edit-datum").value,

							pagina: form.querySelector(".edit-pagina").value,

							gepubliceerd: form.querySelector(".edit-gepubliceerd").checked,

							coverAfbeelding,

							coverAfbeeldingBreedte,

							inhoud

						};


						// Close the edit form's state before onSaveEdit, whose
						// reload (loadPosts -> render) would otherwise see
						// editingId still set and reopen this form with a new
						// Quill instance instead of returning to the display
						// view.
						this.editingId = null;
						this.editQuill = null;


						if (this.onSaveEdit) {

							await this.onSaveEdit(id, changes);

						}


						if (post?.coverAfbeelding && post.coverAfbeelding !== coverAfbeelding) {

							await deletePostImages([post.coverAfbeelding]);

						}

					}
					catch (error) {

						console.error(
							"Post bijwerken mislukt:",
							error
						);

						errorBox.textContent = `Opslaan mislukt: ${error.message}`;
						errorBox.hidden = false;
						submitButton.disabled = false;

					}

				});

			});


		this.container
			.querySelectorAll(".toggle-published-btn")
			.forEach(button => {

				button.addEventListener("click", async () => {

					const card = button.closest(".post-manager-card");
					const id = card.dataset.id;
					const post = posts.find(item => item.id === id);

					if (!post) {
						return;
					}


					button.disabled = true;


					try {

						if (this.onTogglePublished) {

							await this.onTogglePublished(id, !post.gepubliceerd);

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

					const card = button.closest(".post-manager-card");
					const id = card.dataset.id;
					const post = posts.find(item => item.id === id);

					const confirmed = confirm(

						`Weet je zeker dat je "${post?.titel ?? "deze post"}" permanent wilt verwijderen? ` +
						"Dit kan niet ongedaan gemaakt worden."

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
							"Post verwijderen mislukt:",
							error
						);

						alert(`Kon post niet verwijderen: ${error.message}`);

						button.disabled = false;

					}

				});

			});

	}

}
