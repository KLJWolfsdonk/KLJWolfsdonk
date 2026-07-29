import { RESERVATION_STATUSES, USER_ROLES } from './constants.js';

export function isNonEmptyString(value) {
	return typeof value === 'string' && value.trim().length > 0;
}

export function isValidEmail(value) {
	return typeof value === 'string' && /.+@.+\..+/.test(value);
}

export function isValidDateRange(startDate, endDate) {
	const startTime = new Date(startDate).getTime();
	const endTime = new Date(endDate).getTime();
	return !Number.isNaN(startTime) && !Number.isNaN(endTime) && startTime <= endTime;
}

export function isValidReservationStatus(value) {
	return RESERVATION_STATUSES.includes(value);
}

export function isValidUserRole(value) {
	return USER_ROLES.includes(value);
}