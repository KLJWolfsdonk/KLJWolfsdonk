import { uploadPostImage }
from "./postImages.js";


// Quill (window.Quill) is loaded via a plain <script> CDN tag in the admin
// HTML pages, before this module runs — same "no bundler" approach already
// used for jQuery/Bootstrap on the public site.
const TOOLBAR_OPTIONS = [
	["bold", "italic", "underline", "strike"],
	[{ header: [2, 3, false] }],
	[{ list: "ordered" }, { list: "bullet" }],
	["blockquote", "link", "image"],
	["clean"]
];


/**
 * Creates a Quill rich-text editor in `container`, seeded with `initialHtml`,
 * with its image-toolbar button wired to upload straight to Supabase
 * Storage instead of Quill's default (a giant base64 data URI).
 */
export function createRichTextEditor(container, initialHtml = "") {

	const quill = new Quill(container, {
		theme: "snow",
		modules: { toolbar: TOOLBAR_OPTIONS }
	});


	if (initialHtml) {

		quill.clipboard.dangerouslyPasteHTML(initialHtml);

	}


	quill.getModule("toolbar").addHandler("image", () => {

		const input = document.createElement("input");

		input.type = "file";
		input.accept = "image/*";


		input.addEventListener("change", async () => {

			const file = input.files?.[0];

			if (!file) {
				return;
			}


			try {

				const url = await uploadPostImage(file);

				const range = quill.getSelection(true);

				quill.insertEmbed(range.index, "image", url, "user");
				quill.setSelection(range.index + 1);

			}
			catch (error) {

				console.error("Afbeelding uploaden mislukt:", error);

				alert(`Afbeelding uploaden mislukt: ${error.message}`);

			}

		});


		input.click();

	});


	return quill;

}
