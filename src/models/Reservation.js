/**
 * @typedef {Object} ReservationCustomerSnapshot
 * @property {string} naam
 * @property {string} email
 * @property {string} [telefoon]
 * @property {Object} [adres]
 */

/**
 * @typedef {Object} ReservationProductLine
 * @property {string} productId
 * @property {string} productNaamSnapshot
 * @property {string} categorieSnapshot
 * @property {number} quantity
 * @property {number} prijsPerDagSnapshot
 * @property {number} waarborgPerStukSnapshot
 * @property {number} linePrijs
 * @property {number} lineWaarborg
 * @property {boolean} [actief]
 */

/**
 * @typedef {Object} ReservationPricing
 * @property {number} aantalDagen
 * @property {number} subtotaal
 * @property {number} korting
 * @property {number} totaal
 * @property {string} valuta
 */

/**
 * @typedef {Object} ReservationDeposit
 * @property {number} totaal
 * @property {number} terugbetaald
 * @property {string} status
 */

/**
 * @typedef {Object} ReservationProps
 * @property {string} [id]
 * @property {string} customerId
 * @property {ReservationCustomerSnapshot} customerSnapshot
 * @property {string} klant
 * @property {string} email
 * @property {string} [telefoon]
 * @property {string} [opmerkingen]
 * @property {string} [adminNotities]
 * @property {string} startDatum
 * @property {string} eindDatum
 * @property {ReservationProductLine[]} producten
 * @property {string[]} productIds
 * @property {string} status
 * @property {ReservationPricing} prijs
 * @property {ReservationDeposit} waarborg
 * @property {Object} [betaling]
 * @property {Object} [calendar]
 * @property {string} aangemaaktOp
 * @property {string} [aangepastOp]
 * @property {string} [aangemaaktDoor]
 * @property {string} [goedgekeurdDoor]
 * @property {string} [afgehandeldDoor]
 * @property {number} [versie]
 */

/**
 * Model voor een reservatie.
 */
export class Reservation {
	/**
	 * @param {ReservationProps} props
	 */
	constructor(props = {}) {
		/** @type {string} */
		this.id = props.id ?? '';
		/** @type {string} */
		this.customerId = props.customerId ?? '';
		/** @type {ReservationCustomerSnapshot} */
		this.customerSnapshot = props.customerSnapshot ?? { naam: '', email: '' };
		/** @type {string} */
		this.klant = props.klant ?? '';
		/** @type {string} */
		this.email = props.email ?? '';
		/** @type {string} */
		this.telefoon = props.telefoon ?? '';
		/** @type {string} */
		this.opmerkingen = props.opmerkingen ?? '';
		/** @type {string} */
		this.adminNotities = props.adminNotities ?? '';
		/** @type {string} */
		this.startDatum = props.startDatum ?? '';
		/** @type {string} */
		this.eindDatum = props.eindDatum ?? '';
		/** @type {ReservationProductLine[]} */
		this.producten = Array.isArray(props.producten) ? props.producten : [];
		/** @type {string[]} */
		this.productIds = Array.isArray(props.productIds) ? props.productIds : [];
		/** @type {string} */
		this.status = props.status ?? 'aanvraag';
		/** @type {ReservationPricing} */
		this.prijs = props.prijs ?? {
			aantalDagen: 0,
			subtotaal: 0,
			korting: 0,
			totaal: 0,
			valuta: 'EUR',
		};
		/** @type {ReservationDeposit} */
		this.waarborg = props.waarborg ?? {
			totaal: 0,
			terugbetaald: 0,
			status: 'open',
		};
		/** @type {Object | undefined} */
		this.betaling = props.betaling;
		/** @type {Object | undefined} */
		this.calendar = props.calendar;
		/** @type {string} */
		this.aangemaaktOp = props.aangemaaktOp ?? '';
		/** @type {string | undefined} */
		this.aangepastOp = props.aangepastOp;
		/** @type {string | undefined} */
		this.aangemaaktDoor = props.aangemaaktDoor;
		/** @type {string | undefined} */
		this.goedgekeurdDoor = props.goedgekeurdDoor;
		/** @type {string | undefined} */
		this.afgehandeldDoor = props.afgehandeldDoor;
		/** @type {number} */
		this.versie = props.versie ?? 1;
	}

	/**
	 * @param {ReservationProps} props
	 * @returns {Reservation}
	 */
	static from(props) {
		return new Reservation(props);
	}

	/**
	 * @returns {ReservationProps}
	 */
	toJSON() {
		return {
			id: this.id,
			customerId: this.customerId,
			customerSnapshot: { ...this.customerSnapshot },
			klant: this.klant,
			email: this.email,
			telefoon: this.telefoon,
			opmerkingen: this.opmerkingen,
			adminNotities: this.adminNotities,
			startDatum: this.startDatum,
			eindDatum: this.eindDatum,
			producten: this.producten.map((line) => ({ ...line })),
			productIds: [...this.productIds],
			status: this.status,
			prijs: { ...this.prijs },
			waarborg: { ...this.waarborg },
			betaling: this.betaling ? { ...this.betaling } : undefined,
			calendar: this.calendar ? { ...this.calendar } : undefined,
			aangemaaktOp: this.aangemaaktOp,
			aangepastOp: this.aangepastOp,
			aangemaaktDoor: this.aangemaaktDoor,
			goedgekeurdDoor: this.goedgekeurdDoor,
			afgehandeldDoor: this.afgehandeldDoor,
			versie: this.versie,
		};
	}
}
