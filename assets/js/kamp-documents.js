import { kampService }
from "../../src/services/KampService.js";

import { escapeHtml }
from "../../src/shared/helpers.js";




async function loadKampDocuments() {

	const container =
		document.getElementById("kamp-documents-list");

	if (!container) {
		return;
	}


	try {

		const documents =
			await kampService.getDocuments();


		if (!documents || documents.length === 0) {

			container.innerHTML = `<p class="text-muted">Er zijn nog geen documenten beschikbaar.</p>`;

			return;

		}


		container.innerHTML = `
			<ul>
				${documents.map(doc => `
					<li>
						<a href="${escapeHtml(doc.bestandUrl)}" target="_blank" rel="noopener" download>
							${escapeHtml(doc.titel)}
						</a>
					</li>
				`).join("")}
			</ul>
		`;

	}
	catch (error) {

		console.error(
			"Kon documenten niet laden:",
			error
		);

		container.innerHTML = `<p class="text-muted">Kon documenten niet laden.</p>`;

	}

}


loadKampDocuments();
