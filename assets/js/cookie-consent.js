(function () {

	const GA_ID = window.GA_MEASUREMENT_ID;

	const STORAGE_KEY = "cookie-consent";




	function loadAnalytics() {

		if (!GA_ID || window.__gaLoaded) {
			return;
		}

		window.__gaLoaded = true;

		const script = document.createElement("script");

		script.async = true;
		script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;

		document.head.appendChild(script);

		window.dataLayer = window.dataLayer || [];

		window.gtag = function () {
			window.dataLayer.push(arguments);
		};

		window.gtag("js", new Date());
		window.gtag("config", GA_ID);

	}




	function getConsent() {

		return localStorage.getItem(STORAGE_KEY);

	}




	function setConsent(value) {

		localStorage.setItem(STORAGE_KEY, value);

	}




	function removeBanner() {

		const existing =
			document.getElementById("cookie-consent-banner");

		if (existing) {
			existing.remove();
		}

	}




	function showBanner() {

		removeBanner();

		const banner = document.createElement("div");

		banner.id = "cookie-consent-banner";

		banner.innerHTML = `
			<style>
				#cookie-consent-banner {
					position: fixed;
					left: 0;
					right: 0;
					bottom: 0;
					z-index: 10000;
					background: #1f2933;
					color: #fff;
					padding: 1rem 1.25rem;
					display: flex;
					flex-wrap: wrap;
					gap: 0.75rem 1.5rem;
					align-items: center;
					justify-content: space-between;
					font-family: "Trebuchet MS", Helvetica, sans-serif;
					font-size: 0.92rem;
					box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.25);
				}
				#cookie-consent-banner p {
					margin: 0;
					max-width: 640px;
				}
				#cookie-consent-banner a {
					color: #9ecbff;
				}
				#cookie-consent-banner .cookie-consent-actions {
					display: flex;
					gap: 0.6rem;
					flex-wrap: wrap;
				}
				#cookie-consent-banner button {
					border: none;
					border-radius: 8px;
					padding: 0.6rem 1rem;
					cursor: pointer;
					font: inherit;
					font-weight: 600;
				}
				#cookie-consent-banner .cookie-consent-accept {
					background: #2f7d32;
					color: #fff;
				}
				#cookie-consent-banner .cookie-consent-decline {
					background: rgba(255, 255, 255, 0.12);
					color: #fff;
				}
			</style>
			<p>
				Deze website gebruikt Google Analytics om het bezoek te meten. Dit gebeurt enkel met jouw
				toestemming. Meer info in onze <a href="/verhuur/privacy.html">privacyverklaring</a>.
			</p>
			<div class="cookie-consent-actions">
				<button type="button" class="cookie-consent-decline">Weigeren</button>
				<button type="button" class="cookie-consent-accept">Accepteren</button>
			</div>
		`;

		document.body.appendChild(banner);

		banner
			.querySelector(".cookie-consent-accept")
			.addEventListener("click", () => {

				setConsent("granted");
				loadAnalytics();
				removeBanner();

			});

		banner
			.querySelector(".cookie-consent-decline")
			.addEventListener("click", () => {

				setConsent("denied");
				removeBanner();

			});

	}




	// Exposed so a "cookie-instellingen" link can let visitors change their
	// mind later, as easily as they gave consent in the first place.
	window.reopenCookieConsent = showBanner;




	function init() {

		const consent = getConsent();

		if (consent === "granted") {
			loadAnalytics();
		}
		else if (consent !== "denied") {
			showBanner();
		}

	}


	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	}
	else {
		init();
	}

})();
