/**
 * @typedef {Object} ProductProps
 * @property {string} [id]
 * @property {string} naam
 * @property {string} categorie
 * @property {string} beschrijving
 * @property {number} prijsPerDag
 * @property {number} waarborg
 * @property {number} voorraad
 * @property {string[]} afbeeldingen
 * @property {boolean} actief
 * @property {string} [createdAt]
 * @property {string} [updatedAt]
 */

/**
 * Model voor een verhuurartikel.
 */
export class Product {
	/**
	 * @param {ProductProps} props
	 */
	constructor(props = {}) {
		/** @type {string} */
		this.id = props.id ?? '';
		/** @type {string} */
		this.naam = props.naam ?? '';
		/** @type {string} */
		this.categorie = props.categorie ?? '';
		/** @type {string} */
		this.beschrijving = props.beschrijving ?? '';
		/** @type {number} */
		this.prijsPerDag = props.prijsPerDag ?? 0;
		/** @type {number} */
		this.waarborg = props.waarborg ?? 0;
		/** @type {number} */
		this.voorraad = props.voorraad ?? 0;
		/** @type {string[]} */
		this.afbeeldingen = Array.isArray(props.afbeeldingen) ? props.afbeeldingen : [];
		/** @type {boolean} */
		this.actief = props.actief ?? true;
		/** @type {string | undefined} */
		this.createdAt = props.createdAt;
		/** @type {string | undefined} */
		this.updatedAt = props.updatedAt;
	}

	/**
	 * @param {ProductProps} props
	 * @returns {Product}
	 */
	static from(props) {
		return new Product(props);
	}

	/**
	 * @returns {ProductProps}
	 */
	toJSON() {
		return {
			id: this.id,
			naam: this.naam,
			categorie: this.categorie,
			beschrijving: this.beschrijving,
			prijsPerDag: this.prijsPerDag,
			waarborg: this.waarborg,
			voorraad: this.voorraad,
			afbeeldingen: [...this.afbeeldingen],
			actief: this.actief,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt,
		};
	}
}
