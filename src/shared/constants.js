export const APP_NAME = 'KLJ Wolfsdonk';
export const DEFAULT_CURRENCY = 'EUR';
export const DEFAULT_REPOSITORY_MODE = 'supabase';

export const RESERVATION_STATUSES = Object.freeze([
	'aanvraag',
	'bevestigd',
	'geweigerd',
	'voltooid',
]);

export const AVAILABILITY_STATUSES = Object.freeze([
	'beschikbaar',
	'onder_voorbehoud',
	'verhuurd',
]);

export const USER_ROLES = Object.freeze([
	'admin',
	'editor',
	'viewer',
]);

export const REPOSITORY_MODES = {
    MOCK: "mock",
    SUPABASE: "supabase"
};