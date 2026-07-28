/**
 * @typedef {Object} CustomerAddress
 * @property {string} [straat]
 * @property {string} [nummer]
 * @property {string} [postcode]
 * @property {string} [gemeente]
 * @property {string} [land]
 */

/**
 * @typedef {Object} CustomerProps
 * @property {string} [id]
 * @property {string} naam
 * @property {string} email
 * @property {string} [telefoon]
 * @property {CustomerAddress} [adres]
 * @property {boolean} [actief]
 * @property {string} [notities]
 * @property {string} [createdAt]
 * @property {string} [updatedAt]
 */

/**
 * Model voor een klant.
 */
export class Customer {
	/**
	 * @param {CustomerProps} props
	 */
	constructor(props = {}) {
		/** @type {string} */
		this.id = props.id ?? '';
		/** @type {string} */
		this.naam = props.naam ?? '';
		/** @type {string} */
		this.email = props.email ?? '';
		/** @type {string} */
		this.telefoon = props.telefoon ?? '';
		/** @type {CustomerAddress} */
		this.adres = props.adres ?? {};
		/** @type {boolean} */
		this.actief = props.actief ?? true;
		/** @type {string} */
		this.notities = props.notities ?? '';
		/** @type {string | undefined} */
		this.createdAt = props.createdAt;
		/** @type {string | undefined} */
		this.updatedAt = props.updatedAt;
	}

	/**
	 * @param {CustomerProps} props
	 * @returns {Customer}
	 */
	static from(props) {
		return new Customer(props);
	}

	/**
	 * @returns {CustomerProps}
	 */
	toJSON() {
		return {
			id: this.id,
			naam: this.naam,
			email: this.email,
			telefoon: this.telefoon,
			adres: { ...this.adres },
			actief: this.actief,
			notities: this.notities,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt,
		};
	}
}
