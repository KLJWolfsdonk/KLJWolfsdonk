import { pageSectionService }
from "../../src/services/PageSectionService.js";

import { escapeHtml }
from "../../src/shared/helpers.js";


/**
 * Fetches every page_sections row for `page` and injects each one's
 * (sanitized) content into the element with id "`${page}-${sectionKey}`".
 * `sectionKeys` lists which sections this page expects, so a failed fetch
 * can show a friendly message in each of them instead of leaving stale
 * "laden..." placeholders.
 */
export async function loadPageSections(page, sectionKeys) {

	const containers =
		sectionKeys
			.map(key => ({ key, el: document.getElementById(`${page}-${key}`) }))
			.filter(entry => entry.el);


	if (containers.length === 0) {
		return;
	}


	try {

		const sections =
			await pageSectionService.getByPage(page);

		const byKey =
			new Map(sections.map(section => [section.sectionKey, section]));


		containers.forEach(({ key, el }) => {

			const section = byKey.get(key);

			if (!section) {
				el.innerHTML = "";
				return;
			}

			const sanitizedContent =
				typeof DOMPurify !== "undefined"
					? DOMPurify.sanitize(section.content)
					: section.content;

			const titleHtml =
				section.title
					? `<h2 class="notopgap">${escapeHtml(section.title)}</h2>`
					: "";

			el.innerHTML = titleHtml + sanitizedContent;

		});

	}
	catch (error) {

		console.error(
			`Kon inhoud voor ${page} niet laden:`,
			error
		);

		containers.forEach(({ el }) => {

			el.innerHTML = `<p class="text-muted">Kon inhoud niet laden.</p>`;

		});

	}

}
