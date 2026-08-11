import { leidingService }
from "../../src/services/LeidingService.js";

import { escapeHtml }
from "../../src/shared/helpers.js";


function renderLid(lid) {

	const titel =
		escapeHtml(lid.voornaam) +
		(lid.bijnaam ? ` (${escapeHtml(lid.bijnaam)})` : "");

	const taken =
		(lid.taken ?? [])
			.map(taak => `<span>${escapeHtml(taak)}</span><br />`)
			.join("");

	return `
		<div class="col-md-12 col-lg-6">
			<div class="card my-3 p-2 shadow">
				<div class="row">
					<div class="col-6">
						<img class="img-fluid rounded" src="${escapeHtml(lid.fotoUrl ?? "")}" alt="foto ${escapeHtml(lid.voornaam)} ${escapeHtml(lid.achternaam ?? "")}">
					</div>
					<div class="col-6">
						<h4 class="card-title">${titel}</h4>
						<p>${escapeHtml(lid.voornaam)} ${escapeHtml(lid.achternaam ?? "")}</p>
						<p><i class="fas fa-birthday-cake"></i> ${escapeHtml(lid.geboorte ?? "")}</p>
						${lid.gsm ? `<p><b>GSM: </b>${escapeHtml(lid.gsm)}</p>` : ""}
						${lid.studie ? `<p><b>Studie: </b>${escapeHtml(lid.studie)}<br /></p>` : ""}
						${lid.werk ? `<p><b>Werk: </b>${escapeHtml(lid.werk)}<br /></p>` : ""}
						<hr>
						<p><b>Taken bij KLJ:</b><br />${taken}</p>
						<p><b>Lievelingseten: </b>${escapeHtml(lid.eten ?? "")}<br /></p>
						<p><b>Lievelingsspelletje: </b>${escapeHtml(lid.spel ?? "")}<br /></p>
					</div>
				</div>
			</div>
		</div>
	`;

}


function groepSlug(groep) {

	return `leiding-groep-${groep.id}`;

}


function renderTab(groep, isActive) {

	const slug = groepSlug(groep);

	return `
		<li class="nav-item">
			<a
				class="nav-link${isActive ? " active" : ""}"
				id="${slug}-tab"
				data-toggle="tab"
				href="#${slug}"
				role="tab"
				aria-controls="${slug}"
				aria-selected="${isActive ? "true" : "false"}"
			>${escapeHtml(groep.naam)}</a>
		</li>
	`;

}


function renderPane(groep, isActive) {

	const slug = groepSlug(groep);

	return `
		<div
			class="tab-pane fade show${isActive ? " active" : ""}"
			id="${slug}"
			role="tabpanel"
			aria-labelledby="${slug}-tab"
		>
			<h2>${escapeHtml(groep.naam)}</h2>
			<hr>
			${groep.groepFotoUrl
				? `<img src="${escapeHtml(groep.groepFotoUrl)}" alt="Leiding ${escapeHtml(groep.naam)}" class="img-fluid rounded shadow mx-auto d-block" width="563" height="376">`
				: ""
			}
			<div class="row">
				${groep.leden.map(renderLid).join("")}
			</div>
		</div>
	`;

}


async function loadLeiding() {

	const tabsList =
		document.getElementById("leidingTab");

	const tabsContent =
		document.getElementById("leidingTab-content");

	if (!tabsList || !tabsContent) {
		return;
	}

	tabsContent.innerHTML = `<p class="text-muted">Leiding laden...</p>`;


	try {

		const groepen =
			await leidingService.getAll();

		if (!groepen || groepen.length === 0) {

			tabsList.innerHTML = "";
			tabsContent.innerHTML = `<p class="text-muted">Nog geen leiding beschikbaar.</p>`;

			return;

		}

		tabsList.innerHTML =
			groepen.map((groep, index) => renderTab(groep, index === 0)).join("");

		tabsContent.innerHTML =
			groepen.map((groep, index) => renderPane(groep, index === 0)).join("");

	}
	catch (error) {

		console.error(
			"Kon leiding niet laden:",
			error
		);

		tabsContent.innerHTML = `<p class="text-muted">Kon leiding niet laden.</p>`;

	}

}


loadLeiding();
