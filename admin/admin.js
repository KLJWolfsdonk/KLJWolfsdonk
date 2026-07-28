import { initDashboardModule } from './dashboard.js';
import { initLoginModule } from './login.js';
import { initAdminProductsModule } from './products.js';
import { initReservationsModule } from './reservations.js';
import { getFirebaseConfig } from './firebase.js';

/**
 * Hoofdentry voor het adminscherm.
 * De login- en beheerflows worden gescheiden opgestart.
 */
function bootstrapAdminModule() {
	getFirebaseConfig();
	initLoginModule();
	initDashboardModule();
	initReservationsModule();
	initAdminProductsModule();
}

document.addEventListener('DOMContentLoaded', bootstrapAdminModule);
