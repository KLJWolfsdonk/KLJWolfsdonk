import { productRepository } from '../repositories/mock/ProductRepository.js';
import { reservationService } from './ReservationService.js';
import { normalizeText } from '../shared/dateUtils.js';

/**
 * Business rules for products.
 */
export class ProductService {
	constructor(products = productRepository, reservations = reservationService) {
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
	 * Computes availability from current reservations without storing it on the product itself.
	 * @param {Array<Object>} products
	 * @param {Object} [period]
	 * @returns {Promise<Array<Object>>}
	 */
	async _enrichWithAvailability(products, period = null) {
		const reservations = await this.reservations.getAll();
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
		return ['aanvraag', 'goedgekeurd', 'betaald'].includes(reservation.status);
	}
}

export const productService = new ProductService();
