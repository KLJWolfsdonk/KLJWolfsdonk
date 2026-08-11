import { guardAdminPage }
from "./authGuard.js";

import { mountPageSection }
from "./pageSectionsManager.js";

import { mountPostsManager }
from "./postsManager.js";




const logoutButton =
	document.getElementById(
		"logout-button"
	);




await guardAdminPage(logoutButton);


mountPageSection("activiteiten", "uitleg", "uitleg");

mountPostsManager("activiteiten");
