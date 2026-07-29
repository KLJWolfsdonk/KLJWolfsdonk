let products = [];


/**
 * Voeg product toe aan winkelmand
 */
export function addProduct(product) {

	const existing = products.find(
		item => item.id === product.id
	);


	if (existing) {

		existing.quantity++;

	}
	else {

		products.push({
			...product,
			quantity: 1
		});

	}

}



/**
 * Verwijder volledig product
 */
export function removeProduct(id) {

	products = products.filter(
		product => product.id !== id
	);

}



/**
 * Verhoog aantal
 */
export function increaseQuantity(id) {

	const product = products.find(
		item => item.id === id
	);


	if (product) {

		product.quantity++;

	}

}



/**
 * Verlaag aantal
 */
export function decreaseQuantity(id) {

	const product = products.find(
		item => item.id === id
	);


	if (product && product.quantity > 1) {

		product.quantity--;

	}

}



/**
 * Geef huidige winkelmand
 */
export function getProducts() {

	return products;

}



/**
 * Maak winkelmand leeg
 */
export function clearCart() {

	products = [];

}



/**
 * Bereken huurprijs per dag
 */
export function getSubtotalPerDay() {

	return products.reduce(
		(total, product) => {

			return total +
				(product.prijsPerDag * product.quantity);

		},
		0
	);

}



/**
 * Bereken waarborg
 */
export function getDepositTotal() {

	return products.reduce(
		(total, product) => {

			return total +
				(product.waarborg * product.quantity);

		},
		0
	);

}