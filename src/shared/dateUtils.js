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
 * Counts the number of days between two ISO date strings, minimum 1.
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
 * Normalizes a text value for case-insensitive search.
 * @param {string} value
 * @returns {string}
 */
export function normalizeText(value) {
	return String(value ?? '').trim().toLowerCase();
}
