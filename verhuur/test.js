import { productService } from '../src/services/ProductService.js';

const DEFAULT_START_DATE = '2026-07-28';
const DEFAULT_END_DATE = '2026-07-29';

const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');
const reloadButton = document.getElementById('reload-button');
const statusMessage = document.getElementById('status-message');
const productList = document.getElementById('product-list');

startDateInput.value = DEFAULT_START_DATE;
endDateInput.value = DEFAULT_END_DATE;

reloadButton.addEventListener('click', loadProducts);

startDateInput.addEventListener('change', loadProducts);
endDateInput.addEventListener('change', loadProducts);

async function loadProducts() {
	const period = {
		startDatum: startDateInput.value,
		eindDatum: endDateInput.value,
	};

	statusMessage.textContent = 'Producten laden...';
	productList.innerHTML = '';

	try {
		const products = await productService.getAll(period);
		renderProducts(products, period);
		statusMessage.textContent = `${products.length} producten geladen via ProductService.`;
	} catch (error) {
		statusMessage.textContent = `Fout bij laden van producten: ${error.message}`;
		productList.innerHTML = '<p>Producten konden niet geladen worden.</p>';
	}
}

/**
 * @param {Array<Object>} products
 * @param {{ startDatum: string, eindDatum: string }} period
 */
function renderProducts(products, period) {
	const summary = document.createElement('p');
	summary.textContent = `Periode: ${period.startDatum} t/m ${period.eindDatum}`;
	productList.appendChild(summary);

	const grid = document.createElement('div');
	grid.style.display = 'grid';
	grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(240px, 1fr))';
	grid.style.gap = '1rem';

	for (const product of products) {
		const card = document.createElement('article');
		card.className = 'card';
		card.style.boxShadow = 'none';
		card.innerHTML = `
			<h2 style="margin-top: 0;">${product.naam}</h2>
			<p><strong>Categorie:</strong> ${product.categorie}</p>
			<p>${product.beschrijving}</p>
			<p><strong>Prijs per dag:</strong> € ${(product.prijsPerDag / 100).toFixed(2)}</p>
			<p><strong>Waarborg:</strong> € ${(product.waarborg / 100).toFixed(2)}</p>
			<p><strong>Voorraad:</strong> ${product.voorraad}</p>
			<p><strong>Beschikbaarheid:</strong> ${product.beschikbaarheid.status} (${product.beschikbaarheid.beschikbaarAantal} beschikbaar)</p>
		`;
		grid.appendChild(card);
	}

	productList.appendChild(grid);
}

loadProducts();