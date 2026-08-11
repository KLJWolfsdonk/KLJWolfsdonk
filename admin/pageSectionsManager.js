import { pageSectionService }
from "../src/services/PageSectionService.js";

import { createRichTextEditor }
from "./richTextEditor.js";




/**
 * Wires up one named rich-text section (e.g. page="over", sectionKey="klj")
 * into the current document's #{prefix}-form/-title/-editor/-error elements.
 * Multiple sections can be mounted on the same page (e.g. Over has 3),
 * each with its own prefix so they save independently.
 */
export async function mountPageSection(page, sectionKey, prefix) {


	const form =
		document.getElementById(`${prefix}-form`);

	const titleInput =
		document.getElementById(`${prefix}-title`);

	const errorBox =
		document.getElementById(`${prefix}-error`);

	const editorContainer =
		document.getElementById(`${prefix}-editor`);


	const existing =
		await pageSectionService.getOne(page, sectionKey);


	if (titleInput) {

		titleInput.value = existing?.title ?? "";

	}


	const editor =
		createRichTextEditor(
			editorContainer,
			existing?.content ?? ""
		);


	form.addEventListener(
		"submit",
		async event => {


			event.preventDefault();

			errorBox.hidden = true;


			try {

				const content =
					DOMPurify.sanitize(editor.root.innerHTML);


				await pageSectionService.update(
					page,
					sectionKey,
					{
						title: titleInput ? titleInput.value.trim() : null,
						content
					}
				);

			}
			catch (error) {

				console.error(
					`Kon sectie ${page}/${sectionKey} niet opslaan:`,
					error
				);

				errorBox.textContent =
					`Opslaan mislukt: ${error.message}`;

				errorBox.hidden = false;

			}

		}
	);

}
