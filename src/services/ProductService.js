import { normalizeText } from '../shared/helpers.js';
import { repositories } from '../repositories/container.js';

/**
 * Business rules for products.
 */
export class ProductService {
	constructor(products = repositories.products, reservations = repositories.reservations) {
		this.products = products;
		this.reservations = reservations;
	}

	/**
	 * @param {Object} [period]
	 * @returns {Promise<Array<Object>>}
	 */
	async getAll(period = null) {
		const products = await this.products.getAll();
		return this._enrichWithAvailability(products, period);
	}

	/**
	 * @param {string} id
	 * @param {Object} [period]
	 * @returns {Promise<Object|null>}
	 */
	async getById(id, period = null) {
		const product = await this.products.getById(id);
		if (!product) {
			return null;
		}

		const [enrichedProduct] = await this._enrichWithAvailability([product], period);
		return enrichedProduct ?? null;
	}

	/**
	 * @param {string} query
	 * @param {Object} [period]
	 * @returns {Promise<Array<Object>>}
	 */
	async search(query, period = null) {
		const results = await this.products.search(query);
		return this._enrichWithAvailability(results, period);
	}

	/**
	 * @param {string} category
	 * @param {Object} [period]
	 * @returns {Promise<Array<Object>>}
	 */
	async getByCategory(category, period = null) {
		const normalizedCategory = normalizeText(category);
		const allProducts = await this.products.getAll();
		const filteredProducts = allProducts.filter((product) => normalizeText(product.categorie) === normalizedCategory);
		return this._enrichWithAvailability(filteredProducts, period);
	}

	/**
	 * For admin product management: every product regardless of active flag,
	 * without the availability enrichment (not meaningful outside a booking
	 * context), so deactivated products can still be found and reactivated.
	 * @returns {Promise<Array<Object>>}
	 */
	async getAllForAdmin() {
		const products = await this.products.getAllIncludingInactive();
		return products.map((product) => product.toJSON());
	}

	/**
	 * @param {Object} input
	 * @returns {Promise<Object>}
	 */
	async create(input) {
		return this.products.create(input);
	}

	/**
	 * @param {string} id
	 * @param {Object} input
	 * @returns {Promise<Object|null>}
	 */
	async update(id, input) {
		return this.products.update(id, input);
	}

	/**
	 * @param {string} id
	 * @returns {Promise<boolean>}
	 */
	async delete(id) {
		return this.products.delete(id);
	}

	/**
	 * Data for a per-product availability calendar: total units owned plus every
	 * active (aanvraag/bevestigd) date range booking some of them.
	 * @param {string} productId
	 * @returns {Promise<{voorraad: number, bookedRanges: Array<{startDatum: string, eindDatum: string, quantity: number}>}>}
	 */
	async getAvailabilityCalendarData(productId) {
		const [product, reservations] = await Promise.all([
			this.products.getById(productId),
			this.reservations.getAllForAvailability(),
		]);

		const bookedRanges = reservations
			.filter((reservation) => this._reservationCountsAgainstAvailability(reservation))
			.map((reservation) => {
				const line = (reservation.producten ?? []).find((item) => item.productId === productId);
				return line
					? {
							startDatum: reservation.startDatum,
							eindDatum: reservation.eindDatum,
							quantity: line.quantity ?? 1,
					}
					: null;
			})
			.filter(Boolean);

		return {
			voorraad: product?.voorraad ?? 0,
			bookedRanges,
		};
	}

	/**
	 * voorraad is the fixed total number of units owned (source of truth in Supabase).
	 * Availability for a given period is computed live by subtracting whatever's
	 * already booked (aanvraag/bevestigd) for overlapping dates, so an item frees
	 * up automatically once its reservation period has passed.
	 * @param {Array<Object>} products
	 * @param {Object} [period]
	 * @returns {Promise<Array<Object>>}
	 */
	async _enrichWithAvailability(products, period = null) {
		const reservations = await this.reservations.getAllForAvailability();
		return products.map((product) => {
			const reservedQuantity = reservations.reduce((total, reservation) => {
				if (!this._reservationCountsAgainstAvailability(reservation)) {
					return total;
				}

				if (!this._reservationMatchesPeriod(reservation, period)) {
					return total;
				}

				const reservedForProduct = Array.isArray(reservation.producten)
					? reservation.producten.reduce((lineTotal, line) => {
							return line.productId === product.id
							? lineTotal + (line.quantity ?? 1)
							: lineTotal;
					}, 0)
					: 0;

				return total + reservedForProduct;
			}, 0);

			const remainingStock = Math.max(product.voorraad - reservedQuantity, 0);
			const status = remainingStock <= 0 ? 'verhuurd' : reservedQuantity > 0 ? 'onder voorbehoud' : 'beschikbaar';

			return {
				...product.toJSON(),
				beschikbaarheid: {
					status,
					beschikbaarAantal: remainingStock,
					gereserveerdAantal: reservedQuantity,
				},
			};
		});
	}

	/**
	 * @param {Object} reservation
	 * @param {Object | null} period
	 * @returns {boolean}
	 */
	_reservationMatchesPeriod(reservation, period) {
		if (!period || !period.startDatum || !period.eindDatum) {
			return true;
		}

		const reservationStart = new Date(reservation.startDatum).getTime();
		const reservationEnd = new Date(reservation.eindDatum).getTime();
		const periodStart = new Date(period.startDatum).getTime();
		const periodEnd = new Date(period.eindDatum).getTime();

		if (Number.isNaN(reservationStart) || Number.isNaN(reservationEnd) || Number.isNaN(periodStart) || Number.isNaN(periodEnd)) {
			return false;
		}

		return reservationStart <= periodEnd && periodStart <= reservationEnd;
	}

	/**
	 * @param {Object} reservation
	 * @returns {boolean}
	 */
	_reservationCountsAgainstAvailability(reservation) {
		return ['aanvraag', 'bevestigd'].includes(reservation.status);
	}
}

export const productService = new ProductService();
