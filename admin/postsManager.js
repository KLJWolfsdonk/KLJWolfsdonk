import { postService }
from "../src/services/PostService.js";

import { PostManagerList }
from "./components/PostManagerList.js";

import { uploadPostImage, deletePostImages }
from "./postImages.js";

import { createRichTextEditor }
from "./richTextEditor.js";

import { toDateInputValue }
from "../src/shared/helpers.js";




/**
 * Wires up a post create-form + managed list for a single, fixed page
 * ("home" or "kamp") into the current document's #post-form/#post-manager-list
 * elements. Call once, after guardAdminPage() has already run on the host page.
 */
export function mountPostsManager(page) {


	const listContainer =
		document.getElementById(
			"post-manager-list"
		);


	const form =
		document.getElementById(
			"post-form"
		);


	const formError =
		document.getElementById(
			"post-form-error"
		);


	const datumInput =
		document.getElementById(
			"new-datum"
		);




	let allPosts = [];

	let postList;


	datumInput.value = toDateInputValue(new Date());


	const newEditor =
		createRichTextEditor(
			document.getElementById("new-inhoud-editor")
		);




	async function loadPosts() {


		allPosts =
			await postService.getAllForAdmin(page);


		// A single fixed page's own sort_order sequence, so reordering is
		// always safe here (unlike the old mixed "every page" admin view).
		postList.render(
			allPosts,
			true
		);


	}




	postList =
		new PostManagerList(

			listContainer,


			async (id, changes) => {

				await postService.update(id, changes);

				await loadPosts();

			},


			async (id, gepubliceerd) => {

				const current =
					allPosts.find(
						post => post.id === id
					);

				if (!current) {
					return;
				}

				await postService.update(
					id,
					{
						...current,
						gepubliceerd
					}
				);

				await loadPosts();

			},


			async id => {

				const current =
					allPosts.find(
						post => post.id === id
					);

				await postService.delete(id);

				if (current?.coverAfbeelding) {

					await deletePostImages([current.coverAfbeelding]);

				}

				await loadPosts();

			},


			async (post, neighbor) => {

				await Promise.all([

					postService.update(post.id, { ...post, volgorde: neighbor.volgorde }),

					postService.update(neighbor.id, { ...neighbor, volgorde: post.volgorde })

				]);

				await loadPosts();

			}

		);




	form.addEventListener(
		"submit",
		async event => {


			event.preventDefault();

			formError.hidden = true;


			try {

				const coverFile =
					document.getElementById("new-cover")?.files?.[0];

				const coverAfbeelding =
					coverFile ? await uploadPostImage(coverFile) : null;

				const coverAfbeeldingBreedte =
					parseInt(document.getElementById("new-cover-breedte").value, 10) || 100;

				const inhoud =
					DOMPurify.sanitize(newEditor.root.innerHTML);


				await postService.create({

					titel:
						document.getElementById("new-titel").value.trim(),

					datum:
						datumInput.value,

					pagina:
						page,

					gepubliceerd:
						document.getElementById("new-gepubliceerd").checked,

					coverAfbeelding,

					coverAfbeeldingBreedte,

					inhoud

				});


				form.reset();

				datumInput.value = toDateInputValue(new Date());

				document.getElementById("new-cover-breedte").value = "100";

				newEditor.setText("");


				await loadPosts();

			}
			catch (error) {

				console.error(
					"Kon post niet toevoegen:",
					error
				);

				formError.textContent =
					`Kon post niet toevoegen: ${error.message}`;

				formError.hidden = false;

			}

		}
	);




	loadPosts();

}
