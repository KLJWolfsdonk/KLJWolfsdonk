import { Reservation } from '../models/Reservation.js';
import { customerRepository } from '../repositories/mock/CustomerRepository.js';
import { reservationRepository } from '../repositories/mock/ReservationRepository.js';
import { productRepository } from '../repositories/mock/ProductRepository.js';
import { countInclusiveDays, rangesOverlap } from '../shared/dateUtils.js';

/**
 * Business rules for reservations.
 */
export class ReservationService {
	constructor(reservations = reservationRepository, customers = customerRepository, products = productRepository) {
		this.reservations = reservations;
		this.customers = customers;
		this.products = products;
	}

	/**
	 * @returns {Promise<Reservation[]>}
	 */
	async getAll() {
		return this.reservations.getAll();
	}

	/**
	 * @param {string} id
	 * @returns {Promise<Reservation|null>}
	 */
	async getById(id) {
		return this.reservations.getById(id);
	}

	/**
	 * @param {string} query
	 * @returns {Promise<Reservation[]>}
	 */
	async search(query) {
		return this.reservations.search(query);
	}

	/**
	 * Creates a reservation after validating customer and pricing inputs.
	 * @param {Object} input
	 * @returns {Promise<Reservation>}
	 */
	async create(input) {
		const preparedReservation = await this._prepareReservation(input);
		return this.reservations.create(preparedReservation.toJSON());
	}

	/**
	 * @param {string} id
	 * @param {Object} input
	 * @returns {Promise<Reservation|null>}
	 */
	async update(id, input) {
		const currentReservation = await this.reservations.getById(id);
		if (!currentReservation) {
			return null;
		}

		const preparedReservation = await this._prepareReservation({ ...currentReservation.toJSON(), ...input, id });
		return this.reservations.update(id, preparedReservation.toJSON());
	}

	/**
	 * @param {string} id
	 * @returns {Promise<boolean>}
	 */
	async delete(id) {
		return this.reservations.delete(id);
	}

	/**
	 * @param {string} status
	 * @returns {Promise<Reservation[]>}
	 */
	async getByStatus(status) {
		const reservations = await this.reservations.getAll();
		return reservations.filter((reservation) => reservation.status === status);
	}

	/**
	 * @param {Object} input
	 * @returns {Promise<Reservation>}
	 */
	async _prepareReservation(input) {
		const customer = await this._resolveCustomer(input);
		const products = await this._resolveProducts(input);
		const numberOfDays = countInclusiveDays(input.startDatum, input.eindDatum);
		const pricing = this._calculatePricing(products, numberOfDays);
		const deposit = this._calculateDeposit(products, pricing);

		return Reservation.from({
			...input,
			customerId: customer.id,
			customerSnapshot: customer.toJSON(),
			klant: customer.naam,
			email: customer.email,
			telefoon: customer.telefoon,
			productIds: products.map((product) => product.id),
			producten: this._buildReservationLines(products),
			prijs: pricing,
			waarborg: deposit,
			status: input.status ?? 'aanvraag',
			aangemaaktOp: input.aangemaaktOp ?? new Date().toISOString(),
			versie: input.versie ?? 1,
		});
	}

	/**
	 * @param {Object} input
	 * @returns {Promise<import('../models/Customer.js').Customer>}
	 */
	async _resolveCustomer(input) {
		if (input.customerId) {
			const byId = await this.customers.getById(input.customerId);
			if (byId) {
				return byId;
			}
		}

		const customerMatch = await this.customers.search(input.email ?? input.klant ?? '');
		if (customerMatch.length > 0) {
			return customerMatch[0];
		}

		const fallbackCustomer = await this.customers.create({
			naam: input.klant ?? '',
			email: input.email ?? '',
			telefoon: input.telefoon ?? '',
			adres: input.adres ?? {},
		});

		return fallbackCustomer;
	}

	/**
	 * @param {Object} input
	 * @returns {Promise<Array<import('../models/Product.js').Product>>}
	 */
	async _resolveProducts(input) {
		const requestedItems = Array.isArray(input.producten) ? input.producten : [];
		const resolvedProducts = [];

		for (const item of requestedItems) {
			const product = await this.products.getById(item.productId);
			if (!product) {
				continue;
			}

			resolvedProducts.push(product);
		}

		return resolvedProducts;
	}

	/**
	 * @param {Array<import('../models/Product.js').Product>} products
	 * @param {number} numberOfDays
	 * @returns {import('../models/Reservation.js').ReservationPricing}
	 */
	_calculatePricing(products, numberOfDays) {
		const subtotaal = products.reduce((total, product) => total + product.prijsPerDag * numberOfDays, 0);
		return {
			aantalDagen: numberOfDays,
			subtotaal,
			korting: 0,
			totaal: subtotaal,
			valuta: 'EUR',
		};
	}

	/**
	 * @param {Array<import('../models/Product.js').Product>} products
	 * @param {import('../models/Reservation.js').ReservationPricing} pricing
	 * @returns {import('../models/Reservation.js').ReservationDeposit}
	 */
	_calculateDeposit(products, pricing) {
		const totaal = products.reduce((sum, product) => sum + product.waarborg, 0);
		return {
			totaal,
			terugbetaald: 0,
			status: pricing.totaal > 0 ? 'open' : 'vrijgegeven',
		};
	}

	/**
	 * @param {Array<import('../models/Product.js').Product>} products
	 * @returns {Array<Object>}
	 */
	_buildReservationLines(products) {
		return products.map((product) => ({
			productId: product.id,
			productNaamSnapshot: product.naam,
			categorieSnapshot: product.categorie,
			quantity: 1,
			prijsPerDagSnapshot: product.prijsPerDag,
			waarborgPerStukSnapshot: product.waarborg,
			linePrijs: product.prijsPerDag,
			lineWaarborg: product.waarborg,
			actief: true,
		}));
	}

	/**
	 * Returns reservations that overlap with the given period.
	 * @param {string} startDatum
	 * @param {string} eindDatum
	 * @returns {Promise<Reservation[]>}
	 */
	async findConflicts(startDatum, eindDatum) {
		const reservations = await this.reservations.getAll();
		return reservations.filter((reservation) => rangesOverlap(reservation.startDatum, reservation.eindDatum, startDatum, eindDatum));
	}
}

export const reservationService = new ReservationService();
