export const ReservationStatus = Object.freeze({
	REQUESTED: 'aanvraag',
	CONFIRMED: 'bevestigd',
	REJECTED: 'geweigerd',
	COMPLETED: 'voltooid',
});

export const AvailabilityStatus = Object.freeze({
	AVAILABLE: 'beschikbaar',
	TENTATIVE: 'onder_voorbehoud',
	RENTED: 'verhuurd',
});

export const UserRole = Object.freeze({
	ADMIN: 'admin',
	EDITOR: 'editor',
	VIEWER: 'viewer',
});