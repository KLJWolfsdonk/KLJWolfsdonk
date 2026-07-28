import { initBookingModule } from './booking.js';
import { initCalendarModule } from './calendar.js';
import { initProductsModule } from './products.js';
import { getFirebaseConfig } from './firebase.js';

/**
 * Hoofdentry voor de publieke verhuurpagina.
 * DOM-rendering en datalaag blijven bewust opgesplitst in losse modules.
 */
function bootstrapRentalModule() {
	getFirebaseConfig();
	initProductsModule();
	initCalendarModule();
	initBookingModule();
}

document.addEventListener('DOMContentLoaded', bootstrapRentalModule);
