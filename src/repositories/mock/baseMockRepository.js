/**
 * Base repository that mimics an asynchronous data source.
 */
export class BaseMockRepository {
	/**
	 * @param {import('./memoryStore.js').getCollection} collectionGetter
	 * @param {import('./memoryStore.js').setCollection} collectionSetter
	 */
	constructor(collectionName) {
		this.collectionName = collectionName;
	}

	/**
	 * @returns {Promise<Array<Object>>}
	 */
	async getAll() {
		return this._resolve(this._read());
	}

	/**
	 * @param {string} id
	 * @returns {Promise<Object|null>}
	 */
	async getById(id) {
		const item = this._read().find((entry) => entry.id === id);
		return this._resolve(item ? this._clone(item) : null);
	}

	/**
	 * @param {Object} data
	 * @returns {Promise<Object>}
	 */
	async create(data) {
		const nextItem = this._clone(data);
		if (!nextItem.id) {
			nextItem.id = this._generateId();
		}

		this._write([...this._read(), nextItem]);
		return this._resolve(this._clone(nextItem));
	}

	/**
	 * @param {string} id
	 * @param {Object} data
	 * @returns {Promise<Object|null>}
	 */
	async update(id, data) {
		const items = this._read();
		const index = items.findIndex((entry) => entry.id === id);
		if (index === -1) {
			return this._resolve(null);
		}

		const nextItem = {
			...items[index],
			...this._clone(data),
			id,
		};
		items[index] = nextItem;
		this._write(items);
		return this._resolve(this._clone(nextItem));
	}

	/**
	 * @param {string} id
	 * @returns {Promise<boolean>}
	 */
	async delete(id) {
		const items = this._read();
		const filteredItems = items.filter((entry) => entry.id !== id);
		const changed = filteredItems.length !== items.length;
		if (changed) {
			this._write(filteredItems);
		}

		return this._resolve(changed);
	}

	/**
	 * @param {string} query
	 * @returns {Promise<Array<Object>>}
	 */
	async search(query) {
		const normalizedQuery = String(query ?? '').trim().toLowerCase();
		if (!normalizedQuery) {
			return this.getAll();
		}

		const results = this._read().filter((item) => this._matchesSearch(item, normalizedQuery));
		return this._resolve(results.map((item) => this._clone(item)));
	}

	/**
	 * @returns {Array<Object>}
	 */
	_read() {
		return this._getCollection();
	}

	/**
	 * @param {Array<Object>} items
	 */
	_write(items) {
		this._setCollection(items);
	}

	/**
	 * @returns {Array<Object>}
	 */
	_getCollection() {
		return [];
	}

	/**
	 * @param {Array<Object>} items
	 */
	_setCollection(items) {
		void items;
	}

	/**
	 * @param {Object} item
	 * @returns {boolean}
	 */
	_matchesSearch(item) {
		void item;
		return false;
	}

	/**
	 * @param {Object} value
	 * @returns {Object}
	 */
	_clone(value) {
		return JSON.parse(JSON.stringify(value));
	}

	/**
	 * @param {unknown} value
	 * @returns {Promise<unknown>}
	 */
	_resolve(value) {
		return Promise.resolve(this._clone(value));
	}

	/**
	 * @returns {string}
	 */
	_generateId() {
		return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
	}
}
