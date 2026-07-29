/**
 * Creates a deep clone of JSON-safe values.
 * @template T
 * @param {T} value
 * @returns {T}
 */
export function clone(value) {
	return value === undefined ? value : JSON.parse(JSON.stringify(value));
}

/**
 * Normalizes a text value for case-insensitive comparisons.
 * @param {string} value
 * @returns {string}
 */
export function normalizeText(value) {
	return String(value ?? '').trim().toLowerCase();
}

/**
 * Counts the inclusive number of days between two ISO date strings.
 * @param {string} startDate
 * @param {string} endDate
 * @returns {number}
 */
export function countInclusiveDays(startDate, endDate) {
	const startTime = new Date(startDate).getTime();
	const endTime = new Date(endDate).getTime();

	if (Number.isNaN(startTime) || Number.isNaN(endTime)) {
		return 0;
	}

	const millisPerDay = 24 * 60 * 60 * 1000;
	const rawDays = Math.floor((endTime - startTime) / millisPerDay) + 1;
	return Math.max(rawDays, 1);
}

/**
 * Returns true when two inclusive date ranges overlap.
 * @param {string} startA
 * @param {string} endA
 * @param {string} startB
 * @param {string} endB
 * @returns {boolean}
 */
export function rangesOverlap(startA, endA, startB, endB) {
	const startTimeA = new Date(startA).getTime();
	const endTimeA = new Date(endA).getTime();
	const startTimeB = new Date(startB).getTime();
	const endTimeB = new Date(endB).getTime();

	if (Number.isNaN(startTimeA) || Number.isNaN(endTimeA) || Number.isNaN(startTimeB) || Number.isNaN(endTimeB)) {
		return false;
	}

	return startTimeA <= endTimeB && startTimeB <= endTimeA;
}

/**
 * Escapes text for safe interpolation into innerHTML.
 * @param {unknown} value
 * @returns {string}
 */
export function escapeHtml(value) {
	return String(value ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

/**
 * Formats money in euro cents.
 * @param {number} cents
 * @returns {string}
 */
export function formatMoney(cents) {
	return `€ ${(cents / 100).toFixed(2)}`;
}

/**
 * Builds a short, human-readable bank transfer reference from a reservation,
 * e.g. "Schaaf-20260801". Not a strict structured reference — just enough
 * for staff to match an incoming transfer to a reservation by eye.
 * @param {{klant?: string, startDatum?: string}} reservation
 * @returns {string}
 */
export function buildPaymentReference(reservation) {
	const nameParts = String(reservation?.klant ?? '')
		.trim()
		.split(/\s+/)
		.filter(Boolean);

	const surname = nameParts.length > 0 ? nameParts[nameParts.length - 1] : 'Klant';

	const datePart = String(reservation?.startDatum ?? '').replaceAll('-', '');

	return `${surname}-${datePart}`;
}

/**
 * Converts a Date to the HTML date input format.
 * @param {Date} date
 * @returns {string}
 */
export function toDateInputValue(date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}