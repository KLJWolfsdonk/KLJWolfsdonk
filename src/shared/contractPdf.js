import { formatMoney } from "./helpers.js";
import { CONTRACT_ARTICLES } from "./contractTerms.js";


const PAGE_HEIGHT = 842;
const MARGIN = 50;
const MAX_WIDTH = 595 - MARGIN * 2;

const VERHUURDER_SIGNATURE_URL =
	new URL("../../assets/img/verhuurder-handtekening.png", import.meta.url).toString();




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




function normalizeKlant(reservation, snapshot) {

	if (snapshot?.klant) {
		return snapshot.klant;
	}

	// Already snapshot-shaped (e.g. the top-level result of the
	// get_reservation_for_contract RPC, for a not-yet-snapshotted contract).
	if (reservation.klant && typeof reservation.klant === "object") {
		return reservation.klant;
	}

	// Admin Reservation model shape (reservation.klant is a plain name string).
	const adres = reservation.customerSnapshot?.adres ?? {};

	return {
		naam: reservation.klant,
		telefoon: reservation.telefoon,
		straat: adres.street,
		huisnummer: adres.houseNumber,
		postcode: adres.postalCode,
		gemeente: adres.city,
		land: adres.country
	};

}




function normalizeProducten(reservation, snapshot) {

	if (snapshot?.producten) {
		return snapshot.producten;
	}

	const producten = reservation.producten ?? [];

	// Already snapshot-shaped.
	if (producten.length === 0 || "prijsPerDag" in producten[0]) {
		return producten;
	}

	// Admin Reservation model shape.
	return producten.map(item => ({
		naam: item.productNaamSnapshot,
		quantity: item.quantity,
		prijsPerDag: item.prijsPerDagSnapshot,
		waarborgPerStuk: item.waarborgPerStukSnapshot,
		linePrijs: item.linePrijs,
		lineWaarborg: item.lineWaarborg
	}));

}




function loadImage(url) {

	return new Promise((resolve, reject) => {

		const image = new Image();

		image.onload = () => resolve(image);
		image.onerror = () => reject(new Error(`Kon afbeelding niet laden: ${url}`));

		image.src = url;

	});

}




/**
 * Builds and downloads a PDF of a (signed) rental contract. Prefers the
 * immutable contract_snapshot captured at signing time; falls back to
 * live/RPC fields for contracts signed before the snapshot feature existed.
 * @param {Object} reservation
 */
export async function downloadContractPdf(reservation) {

	const { jsPDF } = await import("https://esm.sh/jspdf@2");

	const snapshot = reservation.contractSnapshot;

	const klant = normalizeKlant(reservation, snapshot);
	const producten = normalizeProducten(reservation, snapshot);

	const totaal = snapshot?.totaal ?? reservation.prijs?.totaal ?? reservation.totaal ?? 0;
	const waarborgTotaal = snapshot?.waarborgTotaal ?? reservation.waarborg?.totaal ?? reservation.waarborgTotaal ?? 0;
	const startDatum = snapshot?.startDatum ?? reservation.startDatum;
	const eindDatum = snapshot?.eindDatum ?? reservation.eindDatum;
	const articles = snapshot?.termsArticles ?? CONTRACT_ARTICLES;

	const adresLine =
		[klant.straat, klant.huisnummer]
			.filter(Boolean)
			.join(" ") +
		(
			klant.postcode || klant.gemeente
				? `, ${[klant.postcode, klant.gemeente].filter(Boolean).join(" ")}`
				: ""
		);

	const doc = new jsPDF({ unit: "pt", format: "a4" });

	let y = MARGIN;



	function ensureSpace(lineHeight) {

		if (y + lineHeight > PAGE_HEIGHT - MARGIN) {

			doc.addPage();
			y = MARGIN;

		}

	}



	function writeHeading(text, size = 14) {

		ensureSpace(size + 10);

		doc.setFont(undefined, "bold");
		doc.setFontSize(size);
		doc.text(text, MARGIN, y);

		y += size + 8;

	}



	function writeParagraph(text, { size = 10, bold = false, lineGap = 4 } = {}) {

		doc.setFont(undefined, bold ? "bold" : "normal");
		doc.setFontSize(size);

		const lines = doc.splitTextToSize(text, MAX_WIDTH);

		for (const line of lines) {

			ensureSpace(size + lineGap);
			doc.text(line, MARGIN, y);
			y += size + lineGap;

		}

		y += 4;

	}



	writeHeading("Overeenkomst voor het uitlenen van materiaal", 16);
	writeParagraph(`Referentie: ${reservation.id}`, { size: 9 });
	writeParagraph(`Periode: ${formatDate(startDatum)} tot ${formatDate(eindDatum)}`);

	writeHeading("Tussen de ondergetekenden", 12);
	writeParagraph("De verhuurder: KLJ Wolfsdonk, vertegenwoordigd door Louis Schaaf, 0483 11 07 82", { bold: true });
	writeParagraph(
		`De huurder: ${klant.naam ?? "-"}, ${adresLine || "geen adres bekend"}, tel. ${klant.telefoon ?? "-"}`
	);

	writeHeading("Bijlage 1 — Materiaallijst", 12);

	for (const item of producten) {

		writeParagraph(
			`${item.naam} — ${item.quantity}x — ${formatMoney(item.prijsPerDag)}/dag — waarborg ${formatMoney(item.waarborgPerStuk)}/stuk — totaal ${formatMoney(item.linePrijs)}`,
			{ size: 9 }
		);

	}

	writeParagraph(
		`Huur totaal: ${formatMoney(totaal)}    Waarborg totaal: ${formatMoney(waarborgTotaal)}    Te betalen: ${formatMoney(totaal + waarborgTotaal)}`,
		{ bold: true }
	);

	writeHeading("Bepalingen", 12);

	articles.forEach((article, index) => {

		writeHeading(`Artikel ${index + 1} — ${article.title}`, 11);

		article.paragraphs.forEach(paragraph => writeParagraph(paragraph));

	});

	writeHeading("Ondertekening", 12);

	ensureSpace(110);

	const signatureTop = y;

	doc.setFont(undefined, "normal");
	doc.setFontSize(9);
	doc.text("Voor de verhuurder:", MARGIN, signatureTop);
	doc.text("Voor de huurder:", MARGIN + 260, signatureTop);

	try {

		const verhuurderSignature = await loadImage(VERHUURDER_SIGNATURE_URL);

		doc.addImage(verhuurderSignature, "PNG", MARGIN, signatureTop + 10, 180, 60);

	}
	catch (error) {

		console.error("Kon handtekening van de verhuurder niet laden:", error);

	}

	if (reservation.contractSignatureData) {

		doc.addImage(reservation.contractSignatureData, "PNG", MARGIN + 260, signatureTop + 10, 180, 60);

	}

	y = signatureTop + 80;

	writeParagraph(
		reservation.contractSignedAt
			? `Elektronisch ondertekend door de huurder op ${new Date(reservation.contractSignedAt).toLocaleString("nl-BE")}.`
			: "Nog niet ondertekend door de huurder."
	);

	doc.save(`contract-${reservation.id}.pdf`);

}
