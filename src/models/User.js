/**
 * @typedef {Object} UserProps
 * @property {string} [id]
 * @property {string} authUid
 * @property {string} naam
 * @property {string} email
 * @property {string} rol
 * @property {boolean} [actief]
 * @property {string[]} [rechten]
 * @property {string} [displayName]
 * @property {boolean} [calendarAccess]
 * @property {string} [laatsteLoginAt]
 * @property {string} [createdAt]
 * @property {string} [updatedAt]
 */

/**
 * Model voor een applicatiegebruiker.
 */
export class User {
	/**
	 * @param {UserProps} props
	 */
	constructor(props = {}) {
		/** @type {string} */
		this.id = props.id ?? props.authUid ?? '';
		/** @type {string} */
		this.authUid = props.authUid ?? '';
		/** @type {string} */
		this.naam = props.naam ?? '';
		/** @type {string} */
		this.email = props.email ?? '';
		/** @type {string} */
		this.rol = props.rol ?? 'viewer';
		/** @type {boolean} */
		this.actief = props.actief ?? true;
		/** @type {string[]} */
		this.rechten = Array.isArray(props.rechten) ? props.rechten : [];
		/** @type {string} */
		this.displayName = props.displayName ?? props.naam ?? '';
		/** @type {boolean} */
		this.calendarAccess = props.calendarAccess ?? false;
		/** @type {string | undefined} */
		this.laatsteLoginAt = props.laatsteLoginAt;
		/** @type {string | undefined} */
		this.createdAt = props.createdAt;
		/** @type {string | undefined} */
		this.updatedAt = props.updatedAt;
	}

	/**
	 * @param {UserProps} props
	 * @returns {User}
	 */
	static from(props) {
		return new User(props);
	}

	/**
	 * @returns {UserProps}
	 */
	toJSON() {
		return {
			id: this.id,
			authUid: this.authUid,
			naam: this.naam,
			email: this.email,
			rol: this.rol,
			actief: this.actief,
			rechten: [...this.rechten],
			displayName: this.displayName,
			calendarAccess: this.calendarAccess,
			laatsteLoginAt: this.laatsteLoginAt,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt,
		};
	}
}
