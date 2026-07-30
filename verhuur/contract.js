import { supabase } from "../src/shared/supabase.js";
import { escapeHtml, formatMoney, countInclusiveDays } from "../src/shared/helpers.js";
import { CONTRACT_ARTICLES, CONTRACT_TERMS_VERSION } from "../src/shared/contractTerms.js";
import { downloadContractPdf } from "../src/shared/contractPdf.js";


const container =
	document.getElementById("contract-content");

const accessToken =
	new URLSearchParams(window.location.search).get("token");




function formatDate(iso) {

	if (!iso) {
		return "?";
	}

	const date = new Date(iso);

	if (Number.isNaN(date.getTime())) {
		return iso;
	}

	return date.toLocaleDateString("nl-BE");

}




function renderError(message) {

	container.innerHTML = `
		<div class="empty-state">
			<h3>Kan contract niet laden</h3>
			<p>${escapeHtml(message)}</p>
		</div>
	`;

}




function renderAlreadySigned(reservation) {

	container.innerHTML = `
		<div class="empty-state">
			<h3>Contract ondertekend</h3>
			<p>
				Dit contract werd ondertekend op
				${escapeHtml(formatDate(reservation.contractSignedAt))}.
				Bedankt!
			</p>
			<button type="button" id="download-contract" class="ghost-button">
				Download jouw contract (PDF)
			</button>
			<p id="download-error" class="error-message" hidden></p>
		</div>
	`;

	document.getElementById("download-contract")
		.addEventListener("click", async event => {

			const button = event.target;
			const errorEl = document.getElementById("download-error");

			errorEl.hidden = true;

			try {

				button.disabled = true;

				await downloadContractPdf(reservation);

			}
			catch (error) {

				console.error("Kon contract-PDF niet genereren:", error);

				errorEl.textContent =
					"Kon het contract niet als PDF downloaden. Probeer opnieuw.";

				errorEl.hidden = false;

			}
			finally {

				button.disabled = false;

			}

		});

}




function renderContract(reservation) {

	const klant = reservation.klant ?? {};
	const producten = reservation.producten ?? [];

	const adresLine =
		[klant.straat, klant.huisnummer]
			.filter(Boolean)
			.join(" ") +
		(
			klant.postcode || klant.gemeente
				? `, ${[klant.postcode, klant.gemeente].filter(Boolean).join(" ")}`
				: ""
		);

	const aantalDagen =
		countInclusiveDays(reservation.startDatum, reservation.eindDatum);

	container.innerHTML = `

		<h2>Overeenkomst voor het uitlenen van materiaal</h2>

		<p class="muted">Referentie: ${escapeHtml(reservation.id)}</p>

		<h3>Tussen de ondergetekenden</h3>
		<p>
			<strong>De verhuurder:</strong> KLJ Wolfsdonk, vertegenwoordigd door Louis Schaaf, 0483 11 07 82<br>
			<strong>De huurder:</strong> ${escapeHtml(klant.naam)},
			${escapeHtml(adresLine || "geen adres bekend")},
			tel. ${escapeHtml(klant.telefoon)}
		</p>
		<p>
			hierna gezamenlijk "partijen" genoemd, wordt overeengekomen wat volgt.
		</p>

		<h3>Huurperiode</h3>
		<div class="overview-stats">
			<span>Periode: ${escapeHtml(formatDate(reservation.startDatum))} tot ${escapeHtml(formatDate(reservation.eindDatum))}</span>
			<span>Aantal dagen: ${aantalDagen}</span>
		</div>

		<h3>Bijlage 1 — Materiaallijst</h3>
		<table class="contract-table">
			<thead>
				<tr>
					<th>Materiaal</th>
					<th>Aantal</th>
					<th>Prijs/dag</th>
					<th>Waarborg/stuk</th>
					<th>Totaal</th>
				</tr>
			</thead>
			<tbody>
				${producten.map(item => `
					<tr>
						<td>${escapeHtml(item.naam)}</td>
						<td>${item.quantity}</td>
						<td>${formatMoney(item.prijsPerDag)}</td>
						<td>${formatMoney(item.waarborgPerStuk)}</td>
						<td>${formatMoney(item.linePrijs)}</td>
					</tr>
				`).join("")}
			</tbody>
		</table>

		<div class="overview-stats">
			<span>Huur totaal: ${formatMoney(reservation.totaal)}</span>
			<span>Waarborg totaal: ${formatMoney(reservation.waarborgTotaal)}</span>
			<span>Te betalen: ${formatMoney(reservation.totaal + reservation.waarborgTotaal)}</span>
		</div>

		<h3>Bepalingen</h3>
		${CONTRACT_ARTICLES.map((article, index) => `
			<h4>Artikel ${index + 1} — ${escapeHtml(article.title)}</h4>
			${article.paragraphs.map(paragraph => `<p>${escapeHtml(paragraph)}</p>`).join("")}
		`).join("")}

		<h3>Ondertekening</h3>
		<p>Zet hieronder je handtekening om te bevestigen dat je kennis hebt genomen van en akkoord gaat met alle bepalingen van deze overeenkomst.</p>

		<canvas id="signature-pad" width="600" height="200"></canvas>

		<div class="inline-fields">
			<button type="button" id="clear-signature" class="ghost-button ghost-button--outline">Wis</button>
			<button type="button" id="submit-signature" class="ghost-button">Onderteken</button>
		</div>

		<p id="signature-error" class="error-message" hidden></p>

	`;

	setupSignaturePad(reservation);

}




function setupSignaturePad(reservation) {

	const canvas =
		document.getElementById("signature-pad");

	const ctx = canvas.getContext("2d");

	ctx.lineWidth = 2;
	ctx.lineCap = "round";
	ctx.strokeStyle = "#444444";

	let drawing = false;
	let hasDrawn = false;



	function getPos(event) {

		const rect = canvas.getBoundingClientRect();

		const point =
			event.touches ? event.touches[0] : event;

		return {
			x: (point.clientX - rect.left) * (canvas.width / rect.width),
			y: (point.clientY - rect.top) * (canvas.height / rect.height)
		};

	}



	function start(event) {

		event.preventDefault();

		drawing = true;
		hasDrawn = true;

		const pos = getPos(event);

		ctx.beginPath();
		ctx.moveTo(pos.x, pos.y);

	}



	function move(event) {

		if (!drawing) {
			return;
		}

		event.preventDefault();

		const pos = getPos(event);

		ctx.lineTo(pos.x, pos.y);
		ctx.stroke();

	}



	function stop() {

		drawing = false;

	}



	canvas.addEventListener("mousedown", start);
	canvas.addEventListener("mousemove", move);
	window.addEventListener("mouseup", stop);

	canvas.addEventListener("touchstart", start, { passive: false });
	canvas.addEventListener("touchmove", move, { passive: false });
	canvas.addEventListener("touchend", stop);



	document.getElementById("clear-signature")
		.addEventListener("click", () => {

			ctx.clearRect(0, 0, canvas.width, canvas.height);
			hasDrawn = false;

		});



	document.getElementById("submit-signature")
		.addEventListener("click", async () => {

			const errorEl =
				document.getElementById("signature-error");

			errorEl.hidden = true;

			if (!hasDrawn) {

				errorEl.textContent =
					"Zet eerst je handtekening in het vak.";

				errorEl.hidden = false;

				return;

			}

			const submitButton =
				document.getElementById("submit-signature");

			submitButton.disabled = true;

			try {

				const signatureData =
					canvas.toDataURL("image/png");

				const { data, error } =
					await supabase.rpc(
						"sign_reservation_contract",
						{
							p_token: accessToken,
							p_signature_data: signatureData,
							p_terms_version: CONTRACT_TERMS_VERSION,
							p_terms_articles: CONTRACT_ARTICLES,
							p_generated_at: new Date().toISOString()
						}
					);

				if (error) {
					throw error;
				}

				renderAlreadySigned({
					...reservation,
					contractSignedAt: data.contractSignedAt,
					contractSignatureData: signatureData,
					contractSnapshot: data.contractSnapshot
				});

			}
			catch (error) {

				console.error(
					"Kon handtekening niet opslaan:",
					error
				);

				errorEl.textContent =
					"Kon handtekening niet opslaan. Probeer opnieuw.";

				errorEl.hidden = false;

				submitButton.disabled = false;

			}

		});

}




async function load() {

	if (!accessToken) {

		renderError("Geen geldige contractlink opgegeven.");

		return;

	}

	const { data, error } =
		await supabase.rpc(
			"get_reservation_for_contract",
			{ p_token: accessToken }
		);

	if (error) {

		console.error(
			"Kon contract niet laden:",
			error
		);

		renderError(
			"Er ging iets mis bij het laden van het contract."
		);

		return;

	}

	if (!data) {

		renderError(
			"Reservatie niet gevonden of nog niet bevestigd."
		);

		return;

	}

	if (data.contractSignedAt) {

		renderAlreadySigned(data);

		return;

	}

	renderContract(data);

}




load();
