import { guardAdminPage }
from "./authGuard.js";

import { mountPostsManager }
from "./postsManager.js";




const logoutButton =
	document.getElementById(
		"logout-button"
	);




await guardAdminPage(logoutButton);


mountPostsManager("home");
