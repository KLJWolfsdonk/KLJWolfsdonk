import { supabase }
from "../src/shared/supabase.js";


/**
 * Client-side auth gate shared by admin pages: redirects to login.html when
 * there's no session, reveals the logout button, and wires it up. RLS is
 * the real security boundary — this only spares logged-out visitors from
 * seeing a broken/empty admin page.
 */
export async function guardAdminPage(logoutButton) {

	const { data: { session } } =
		await supabase.auth.getSession();


	if (!session) {

		window.location.replace("./login.html" + window.location.search);

	}
	else if (logoutButton) {

		logoutButton.hidden = false;

	}


	supabase.auth.onAuthStateChange((event, newSession) => {

		if (!newSession) {

			window.location.replace("./login.html");

		}

	});


	if (logoutButton) {

		logoutButton.addEventListener(
			"click",
			async () => {

				await supabase.auth.signOut();

				window.location.replace("./login.html");

			}
		);

	}

}
