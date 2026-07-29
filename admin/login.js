import { supabase } from "../src/shared/supabase.js";


const form =
	document.getElementById("login-form");

const emailInput =
	document.getElementById("login-email");

const passwordInput =
	document.getElementById("login-password");

const submitButton =
	document.getElementById("login-submit");

const errorMessage =
	document.getElementById("login-error");



async function redirectIfAlreadyLoggedIn() {

	const { data: { session } } =
		await supabase.auth.getSession();

	if (session) {

		window.location.replace("./index.html" + window.location.search);

	}

}

redirectIfAlreadyLoggedIn();



form.addEventListener("submit", async (event) => {

	event.preventDefault();

	errorMessage.hidden = true;

	submitButton.disabled = true;

	try {

		const { error } =
			await supabase.auth.signInWithPassword({

				email: emailInput.value.trim(),

				password: passwordInput.value

			});

		if (error) {

			errorMessage.textContent =
				"Inloggen mislukt: controleer e-mail en wachtwoord.";

			errorMessage.hidden = false;

			return;

		}

		window.location.replace("./index.html" + window.location.search);

	}
	catch (error) {

		console.error(
			"Login fout:",
			error
		);

		errorMessage.textContent =
			"Er ging iets mis. Probeer opnieuw.";

		errorMessage.hidden = false;

	}
	finally {

		submitButton.disabled = false;

	}

});
