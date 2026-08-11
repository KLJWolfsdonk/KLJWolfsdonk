import { guardAdminPage }
from "./authGuard.js";

import { mountPageSection }
from "./pageSectionsManager.js";




const logoutButton =
	document.getElementById(
		"logout-button"
	);




await guardAdminPage(logoutButton);


mountPageSection("over", "praktisch", "praktisch");
mountPageSection("over", "klj", "klj");
mountPageSection("over", "extra", "extra");
