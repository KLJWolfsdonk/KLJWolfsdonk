import { customerSeedData, productSeedData, reservationSeedData } from './seedData.js';

/**
 * @typedef {Object} MemoryStoreState
 * @property {Array<Object>} products
 * @property {Array<Object>} reservations
 * @property {Array<Object>} customers
 */

/**
 * Creates a clone that is safe to hand to callers.
 * @template T
 * @param {T} value
 * @returns {T}
 */
export function clone(value) {
	return value === undefined ? value : JSON.parse(JSON.stringify(value));
}

const state = {
	products: clone(productSeedData),
	reservations: clone(reservationSeedData),
	customers: clone(customerSeedData),
};

/**
 * @returns {MemoryStoreState}
 */
export function readState() {
	return {
		products: clone(state.products),
		reservations: clone(state.reservations),
		customers: clone(state.customers),
	};
}

/**
 * @param {Partial<MemoryStoreState>} nextState
 */
export function replaceState(nextState) {
	state.products = Array.isArray(nextState.products) ? clone(nextState.products) : state.products;
	state.reservations = Array.isArray(nextState.reservations) ? clone(nextState.reservations) : state.reservations;
	state.customers = Array.isArray(nextState.customers) ? clone(nextState.customers) : state.customers;
}

/**
 * @param {'products' | 'reservations' | 'customers'} collectionName
 * @returns {Array<Object>}
 */
export function getCollection(collectionName) {
	return state[collectionName];
}

/**
 * @param {'products' | 'reservations' | 'customers'} collectionName
 * @param {Array<Object>} items
 */
export function setCollection(collectionName, items) {
	state[collectionName] = clone(items);
}

/**
 * @param {'products' | 'reservations' | 'customers'} collectionName
 * @param {Object} item
 */
export function insertItem(collectionName, item) {
	state[collectionName].push(clone(item));
}

/**
 * @param {'products' | 'reservations' | 'customers'} collectionName
 * @param {string} id
 * @param {Object} nextItem
 */
export function updateItem(collectionName, id, nextItem) {
	const index = state[collectionName].findIndex((entry) => entry.id === id);
	if (index === -1) {
		return false;
	}

	state[collectionName][index] = clone(nextItem);
	return true;
}

/**
 * @param {'products' | 'reservations' | 'customers'} collectionName
 * @param {string} id
 * @returns {boolean}
 */
export function removeItem(collectionName, id) {
	const index = state[collectionName].findIndex((entry) => entry.id === id);
	if (index === -1) {
		return false;
	}

	state[collectionName].splice(index, 1);
	return true;
}
