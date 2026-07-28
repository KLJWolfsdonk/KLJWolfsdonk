/**
 * Reservatieflow voor startdatum, einddatum en geselecteerde producten.
 */
export function initBookingModule() {
	const bookingPanel = document.getElementById('booking-panel');
	if (!bookingPanel) {
		return;
	}

	bookingPanel.dataset.ready = 'true';
}

/**
 * Rendert de sidebar met reservatie-informatie en statuslegende.
 * @param {HTMLElement} bookingPanel
 * @param {{ startDatum: string, eindDatum: string }} period
 */
export function renderBookingSidebar(bookingPanel, period) {
	const periodLabel = `${period?.startDatum ?? ''} t/m ${period?.eindDatum ?? ''}`.trim();
	bookingPanel.innerHTML = `
		<div class="sidebar-panel">
			<p class="section-label">Reservatie</p>
			<h2>Hoe reserveren?</h2>
			<p>Kies je periode, filter de artikels en neem daarna contact op voor de reservatieverwerking.</p>
			<div class="sidebar-box">
				<p><strong>Huidige periode</strong></p>
				<p>${periodLabel}</p>
			</div>
			<div class="sidebar-box">
				<p><strong>Statuskleuren</strong></p>
				<ul class="status-legend">
					<li><span class="status-pill status-pill--beschikbaar">Beschikbaar</span> groen</li>
					<li><span class="status-pill status-pill--onder-voorbehoud">Onder voorbehoud</span> oranje</li>
					<li><span class="status-pill status-pill--verhuurd">Verhuurd</span> rood</li>
				</ul>
			</div>
		</div>
	`;
}

export function calculateReservationPrice() {
	return 0;
}
