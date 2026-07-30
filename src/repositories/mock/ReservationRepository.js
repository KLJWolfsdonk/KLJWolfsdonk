import { Reservation } from '../../models/Reservation.js';
import { getCollection, setCollection } from './memoryStore.js';
import { BaseMockRepository } from './baseMockRepository.js';

/**
 * Mock repository for reservations.
 */
export class ReservationRepository extends BaseMockRepository {
	constructor() {
		super('reservations');
	}

	_getCollection() {
		return getCollection('reservations');
	}

	_setCollection(items) {
		setCollection('reservations', items);
	}

	_matchesSearch(item, query) {
		const productText = Array.isArray(item.producten)
			? item.producten
				.map((line) => [line.productNaamSnapshot, line.categorieSnapshot].filter(Boolean).join(' '))
				.join(' ')
			: '';
		const haystack = [item.klant, item.email, item.telefoon, item.opmerkingen, item.status, productText]
			.filter(Boolean)
			.join(' ')
			.toLowerCase();
		return haystack.includes(query);
	}

	/**
	 * @param {Object} data
	 * @returns {Promise<Reservation>}
	 */
	async create(data) {
		const created = await super.create(Reservation.from(data).toJSON());
		return Reservation.from(created);
	}

	/**
	 * @param {string} id
	 * @returns {Promise<Reservation|null>}
	 */
	async getById(id) {
		const found = await super.getById(id);
		return found ? Reservation.from(found) : null;
	}

	/**
	 * @returns {Promise<Reservation[]>}
	 */
	async getAll() {
		const items = await super.getAll();
		return items.map((item) => Reservation.from(item));
	}

	/**
	 * @param {string} id
	 * @param {Object} data
	 * @returns {Promise<Reservation|null>}
	 */
	async update(id, data) {
		const updated = await super.update(id, data);
		return updated ? Reservation.from(updated) : null;
	}

	/**
	 * @param {string} query
	 * @returns {Promise<Reservation[]>}
	 */
	async search(query) {
		const items = await super.search(query);
		return items.map((item) => Reservation.from(item));
	}

	/**
	 * @param {string} id
	 * @param {string} text
	 * @returns {Promise<Reservation|null>}
	 */
	async addNote(id, text) {
		const current = await this.getById(id);
		if (!current) {
			return null;
		}
		const notities = [
			...current.notities,
			{
				id: `note-${Date.now()}`,
				tekst: text,
				auteurEmail: 'dev@localhost',
				aangemaaktOp: new Date().toISOString(),
			},
		];
		return this.update(id, { notities });
	}

	/**
	 * Lightweight shape matching SupabaseReservationRepository.getAllForAvailability.
	 * @returns {Promise<Array<{id: string, status: string, startDatum: string, eindDatum: string, producten: Array<{productId: string, quantity: number}>}>>}
	 */
	async getAllForAvailability() {
		const reservations = await this.getAll();
		return reservations.map((reservation) => ({
			id: reservation.id,
			status: reservation.status,
			startDatum: reservation.startDatum,
			eindDatum: reservation.eindDatum,
			producten: (reservation.producten ?? []).map((line) => ({
				productId: line.productId,
				quantity: line.quantity,
			})),
		}));
	}
}

export const reservationRepository = new ReservationRepository();
