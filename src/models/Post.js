/**
 * @typedef {Object} PostProps
 * @property {string} [id]
 * @property {string} titel
 * @property {string} inhoud
 * @property {string | null} [coverAfbeelding]
 * @property {number} [coverAfbeeldingBreedte]
 * @property {number} [volgorde]
 * @property {string} [pagina]
 * @property {boolean} [gepubliceerd]
 * @property {string} [datum]
 * @property {string} [auteurEmail]
 * @property {string} [createdAt]
 * @property {string} [updatedAt]
 */

/**
 * Model voor een nieuwsbericht/post.
 */
export class Post {
	/**
	 * @param {PostProps} props
	 */
	constructor(props = {}) {
		/** @type {string} */
		this.id = props.id ?? '';
		/** @type {string} */
		this.titel = props.titel ?? '';
		/** @type {string} */
		this.inhoud = props.inhoud ?? '';
		/** @type {string | null} */
		this.coverAfbeelding = props.coverAfbeelding ?? null;
		/** @type {number} */
		this.coverAfbeeldingBreedte = props.coverAfbeeldingBreedte ?? 100;
		/** @type {number} */
		this.volgorde = props.volgorde ?? 0;
		/** @type {string} */
		this.pagina = props.pagina ?? 'home';
		/** @type {boolean} */
		this.gepubliceerd = props.gepubliceerd ?? false;
		/** @type {string} */
		this.datum = props.datum ?? '';
		/** @type {string | undefined} */
		this.auteurEmail = props.auteurEmail;
		/** @type {string | undefined} */
		this.createdAt = props.createdAt;
		/** @type {string | undefined} */
		this.updatedAt = props.updatedAt;
	}

	/**
	 * @param {PostProps} props
	 * @returns {Post}
	 */
	static from(props) {
		return new Post(props);
	}

	/**
	 * @returns {PostProps}
	 */
	toJSON() {
		return {
			id: this.id,
			titel: this.titel,
			inhoud: this.inhoud,
			coverAfbeelding: this.coverAfbeelding,
			coverAfbeeldingBreedte: this.coverAfbeeldingBreedte,
			volgorde: this.volgorde,
			pagina: this.pagina,
			gepubliceerd: this.gepubliceerd,
			datum: this.datum,
			auteurEmail: this.auteurEmail,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt,
		};
	}
}
