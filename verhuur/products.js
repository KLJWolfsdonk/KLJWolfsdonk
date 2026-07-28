import { productService } from '../src/services/ProductService.js';
import { renderBookingSidebar } from './booking.js';

const STATUS_LABELS = {
	'beschikbaar': 'Beschikbaar',
	'onder voorbehoud': 'Onder voorbehoud',
	'verhuurd': 'Verhuurd',
};

const DEFAULT_PERIOD = getDefaultPeriod();

const state = {
	products: [],
	filteredProducts: [],
	category: 'all',
	search: '',
	period: DEFAULT_PERIOD,
};

/**
 * Initialiseert de publieke productmodule en de filter-UI.
 */
export function initProductsModule() {
	const productList = document.getElementById('product-list');
	const periodFilter = document.getElementById('period-filter');
	const categoryFilter = document.getElementById('category-filter');
	const searchFilter = document.getElementById('search-filter');
	const bookingPanel = document.getElementById('booking-panel');

	if (!productList || !periodFilter || !categoryFilter || !searchFilter || !bookingPanel) {
		return;
	}

	renderFilterShell(periodFilter, categoryFilter, searchFilter);
	renderBookingSidebar(bookingPanel, state.period);
	attachFilterEvents();
	void reloadProducts();
}

/**
 * @param {Array<Object>} products
 * @returns {Array<Object>}
 */
export function renderProducts(products = []) {
	return products;
}

async function reloadProducts() {
	const productList = document.getElementById('product-list');
	const categorySelect = document.getElementById('category-select');
	const periodStart = document.getElementById('period-start');
	const periodEnd = document.getElementById('period-end');
	const bookingPanel = document.getElementById('booking-panel');

	if (!productList || !categorySelect || !periodStart || !periodEnd || !bookingPanel) {
		return;
	}

	state.period = {
		startDatum: periodStart.value,
		eindDatum: periodEnd.value,
	};

	productList.innerHTML = '<p class="muted">Producten laden...</p>';

	try {
		state.products = await productService.getAll(state.period);
		const categories = buildCategories(state.products);
		renderCategoryOptions(categorySelect, categories);
		applyFilters();
		renderBookingSidebar(bookingPanel, state.period);
	} catch (error) {
		productList.innerHTML = `<p class="error-message">Producten konden niet geladen worden: ${error.message}</p>`;
	}
}

function attachFilterEvents() {
	const periodStart = document.getElementById('period-start');
	const periodEnd = document.getElementById('period-end');
	const categorySelect = document.getElementById('category-select');
	const searchInput = document.getElementById('search-input');
	const resetButton = document.getElementById('reset-filters');

	if (periodStart) {
		periodStart.addEventListener('change', async () => {
			if (periodEnd && periodEnd.value < periodStart.value) {
				periodEnd.value = periodStart.value;
			}
			await reloadProducts();
		});
	}

	if (periodEnd) {
		periodEnd.addEventListener('change', async () => {
			if (periodStart && periodStart.value > periodEnd.value) {
				periodStart.value = periodEnd.value;
			}
			await reloadProducts();
		});
	}

	if (categorySelect) {
		categorySelect.addEventListener('change', () => {
			state.category = categorySelect.value;
			applyFilters();
		});
	}

	if (searchInput) {
		searchInput.addEventListener('input', () => {
			state.search = searchInput.value;
			applyFilters();
		});
	}

	if (resetButton) {
		resetButton.addEventListener('click', async () => {
			state.category = 'all';
			state.search = '';
			if (categorySelect) {
				categorySelect.value = 'all';
			}
			if (searchInput) {
				searchInput.value = '';
			}
			const defaultPeriod = getDefaultPeriod();
			const startInput = document.getElementById('period-start');
			const endInput = document.getElementById('period-end');
			if (startInput && endInput) {
				startInput.value = defaultPeriod.startDatum;
				endInput.value = defaultPeriod.eindDatum;
			}
			await reloadProducts();
		});
	}
}

function applyFilters() {
	const productList = document.getElementById('product-list');
	if (!productList) {
		return;
	}

	const normalizedSearch = state.search.trim().toLowerCase();
	const filteredProducts = state.products.filter((product) => {
		const matchesCategory = state.category === 'all' || product.categorie === state.category;
		const haystack = [product.naam, product.categorie, product.beschrijving, product.beschikbaarheid.status]
			.filter(Boolean)
			.join(' ')
			.toLowerCase();
		const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch);
		return matchesCategory && matchesSearch;
	});

	state.filteredProducts = filteredProducts;
	renderProductList(productList, filteredProducts);
}

/**
 * @param {HTMLElement} productList
 * @param {Array<Object>} products
 */
function renderProductList(productList, products) {
	const overview = document.createElement('div');
	overview.className = 'overview-row';
	overview.innerHTML = `
		<div>
			<p class="section-label">Overzicht</p>
			<h2>${products.length} producten gevonden</h2>
		</div>
		<div class="overview-stats">
			<span>${countByStatus(products, 'beschikbaar')} beschikbaar</span>
			<span>${countByStatus(products, 'onder voorbehoud')} onder voorbehoud</span>
			<span>${countByStatus(products, 'verhuurd')} verhuurd</span>
		</div>
	`;

	const grid = document.createElement('div');
	grid.className = 'product-grid';

	if (products.length === 0) {
		productList.innerHTML = '';
		productList.appendChild(overview);
		const emptyState = document.createElement('div');
		emptyState.className = 'empty-state';
		emptyState.innerHTML = '<h3>Geen producten gevonden</h3><p>Pas je zoekterm, categorie of periode aan.</p>';
		productList.appendChild(emptyState);
		return;
	}

	for (const product of products) {
		const card = document.createElement('article');
		card.className = 'product-card card';
		card.innerHTML = `
			<div class="product-media" aria-hidden="true">
				${renderProductMedia(product)}
			</div>
			<div class="product-body">
				<div class="product-header">
					<div>
						<p class="product-category">${product.categorie}</p>
						<h3>${product.naam}</h3>
					</div>
					<span class="status-pill status-pill--${normalizeStatus(product.beschikbaarheid.status)}">${STATUS_LABELS[product.beschikbaarheid.status] ?? product.beschikbaarheid.status}</span>
				</div>
				<p class="product-description">${product.beschrijving}</p>
				<div class="product-meta">
					<span>Prijs per dag: ${formatMoney(product.prijsPerDag)}</span>
					<span>Waarborg: ${formatMoney(product.waarborg)}</span>
					<span>Voorraad: ${product.voorraad}</span>
					<span>Beschikbaar: ${product.beschikbaarheid.beschikbaarAantal}</span>
				</div>
			</div>
		`;
		grid.appendChild(card);
	}

	productList.innerHTML = '';
	productList.appendChild(overview);
	productList.appendChild(grid);
}

/**
 * @param {HTMLElement} periodFilter
 * @param {HTMLElement} categoryFilter
 * @param {HTMLElement} searchFilter
 */
function renderFilterShell(periodFilter, categoryFilter, searchFilter) {
	periodFilter.innerHTML = `
		<label class="field-group">
			<span>Periode</span>
			<div class="inline-fields">
				<input id="period-start" type="date" value="${state.period.startDatum}" />
				<input id="period-end" type="date" value="${state.period.eindDatum}" />
			</div>
		</label>
	`;

	categoryFilter.innerHTML = `
		<label class="field-group">
			<span>Categorie</span>
			<select id="category-select">
				<option value="all">Alle categorieën</option>
			</select>
		</label>
	`;

	searchFilter.innerHTML = `
		<label class="field-group">
			<span>Zoeken</span>
			<div class="search-row">
				<input id="search-input" type="search" placeholder="Zoek op naam, categorie of beschrijving" />
				<button id="reset-filters" class="ghost-button" type="button">Reset</button>
			</div>
		</label>
	`;

	const bookingPanel = document.getElementById('booking-panel');
	if (bookingPanel) {
		renderBookingSidebar(bookingPanel, state.period);
	}
}

/**
 * @param {HTMLElement} select
 * @param {Array<string>} categories
 */
function renderCategoryOptions(select, categories) {
	const currentValue = select.value;
	select.innerHTML = '<option value="all">Alle categorieën</option>';

	for (const category of categories) {
		const option = document.createElement('option');
		option.value = category;
		option.textContent = category;
		select.appendChild(option);
	}

	select.value = categories.includes(currentValue) ? currentValue : 'all';
	state.category = select.value;
}

/**
 * @param {Array<Object>} products
 * @returns {Array<string>}
 */
function buildCategories(products) {
	return [...new Set(products.map((product) => product.categorie).filter(Boolean))].sort((left, right) => left.localeCompare(right));
}

function getDefaultPeriod() {
	const today = new Date();
	const tomorrow = new Date(today);
	tomorrow.setDate(today.getDate() + 1);
	return {
		startDatum: toDateInputValue(today),
		eindDatum: toDateInputValue(tomorrow),
	};
}

/**
 * @param {Date} date
 * @returns {string}
 */
function toDateInputValue(date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

/**
 * @param {number} cents
 * @returns {string}
 */
function formatMoney(cents) {
	return `€ ${(cents / 100).toFixed(2)}`;
}

/**
 * @param {string} status
 * @returns {string}
 */
function normalizeStatus(status) {
	return String(status ?? '')
		.trim()
		.toLowerCase()
		.replace(/\s+/g, '-');
}

/**
 * @param {Array<Object>} products
 * @param {string} status
 * @returns {number}
 */
function countByStatus(products, status) {
	return products.filter((product) => product.beschikbaarheid.status === status).length;
}

/**
 * @param {Object} product
 * @returns {string}
 */
function renderProductMedia(product) {
	const firstImage = Array.isArray(product.afbeeldingen) ? product.afbeeldingen[0] : '';
	if (firstImage) {
		return `<img src="${firstImage}" alt="${product.naam}" />`;
	}

	return `<span>${product.naam.slice(0, 1).toUpperCase()}</span>`;
}
