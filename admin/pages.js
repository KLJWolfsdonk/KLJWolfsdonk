import { guardAdminPage }
from "./authGuard.js";




const logoutButton =
	document.getElementById(
		"logout-button"
	);




await guardAdminPage(logoutButton);
