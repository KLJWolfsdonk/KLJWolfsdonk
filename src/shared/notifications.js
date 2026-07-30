import emailjs from "https://esm.sh/@emailjs/browser@4";

import { appConfig } from "./config.js";
import { formatMoney, buildPaymentReference } from "./helpers.js";


let initialized = false;


function ensureInitialized() {

	if (initialized) {
		return;
	}

	emailjs.init(appConfig.emailjs.publicKey);

	initialized = true;

}


function formatProducten(producten) {

	return (producten ?? [])
		.map(item => `${item.productNaamSnapshot} x${item.quantity}`)
		.join(", ");

}


function isConfigured(...values) {

	return values.every(value =>
		value && !value.startsWith("YOUR_EMAILJS_")
	);

}


/**
 * Best-effort notification to admins about a new reservation. Never throws —
 * a failed/misconfigured notification should never break the booking flow,
 * since the reservation itself is already saved by the time this runs.
 * @param {Object} reservation
 * @param {string} adminLink
 */
export async function notifyAdminsOfNewReservation(reservation, adminLink) {

	const { publicKey, serviceId, newReservationTemplateId } = appConfig.emailjs;

	if (!isConfigured(publicKey, serviceId, newReservationTemplateId)) {

		console.warn(
			"EmailJS is niet geconfigureerd, admin-notificatie overgeslagen."
		);

		return;

	}

	try {

		ensureInitialized();

		await emailjs.send(
			serviceId,
			newReservationTemplateId,
			{
				reservation_id: reservation.id,
				klant_naam: reservation.klant,
				klant_email: reservation.email,
				klant_telefoon: reservation.telefoon,
				start_datum: reservation.startDatum,
				eind_datum: reservation.eindDatum,
				producten: formatProducten(reservation.producten),
				admin_link: adminLink
			}
		);

	}
	catch (error) {

		console.error(
			"Kon admin-notificatie niet versturen:",
			error
		);

	}

}


/**
 * Shared sender for the single customer-facing "status update" template.
 * EmailJS's free plan caps templates at 2, so confirmation and rejection
 * emails reuse the same template — only heading/icon/intro/details differ,
 * all supplied here as plain content rather than needing separate templates.
 * Never throws: a failed/misconfigured notification should never break the
 * admin's status-update action, since the reservation itself is already saved.
 * @param {Object} reservation
 * @param {{heading: string, icon: string, intro: string, detailsMessage: string}} content
 * @param {string} failureLabel
 */
async function sendCustomerStatusEmail(reservation, content, failureLabel) {

	const { publicKey, serviceId, confirmationTemplateId } = appConfig.emailjs;

	if (!isConfigured(publicKey, serviceId, confirmationTemplateId)) {

		console.warn(
			`EmailJS is niet geconfigureerd, ${failureLabel} overgeslagen.`
		);

		return false;

	}

	if (!reservation.email) {

		console.warn(
			`Geen e-mailadres bekend voor reservatie, ${failureLabel} overgeslagen:`,
			reservation.id
		);

		return false;

	}

	try {

		ensureInitialized();

		await emailjs.send(
			serviceId,
			confirmationTemplateId,
			{
				to_email: reservation.email,
				reservation_id: reservation.id,
				klant_naam: reservation.klant,
				start_datum: reservation.startDatum,
				eind_datum: reservation.eindDatum,
				producten: formatProducten(reservation.producten),
				heading: content.heading,
				icon: content.icon,
				intro: content.intro,
				details_message: content.detailsMessage
			}
		);

		return true;

	}
	catch (error) {

		console.error(
			`Kon ${failureLabel} niet versturen:`,
			error
		);

		return false;

	}

}


/**
 * Best-effort order confirmation sent to the customer once their reservation
 * is confirmed by an admin.
 * @param {Object} reservation
 */
export async function notifyCustomerOfConfirmation(reservation) {

	const teBetalen =
		(reservation.prijs?.totaal ?? 0) +
		(reservation.waarborg?.totaal ?? 0);

	const contractLink =
		`${appConfig.siteUrl}/verhuur/contract.html?token=${reservation.accessToken}`;

	const detailsMessage =
		`Te betalen: <strong>${formatMoney(teBetalen)}</strong> ` +
		`(huur ${formatMoney(reservation.prijs?.totaal ?? 0)} + waarborg ${formatMoney(reservation.waarborg?.totaal ?? 0)}).<br>` +
		`Gelieve dit over te schrijven naar <strong>${appConfig.payment.iban}</strong> ` +
		`met als mededeling <strong>${buildPaymentReference(reservation)}</strong>.<br><br>` +
		`Gelieve ook het huurcontract te ondertekenen via deze link: ` +
		`<a href="${contractLink}">${contractLink}</a>`;

	return sendCustomerStatusEmail(

		reservation,

		{
			heading: "Reservatie bevestigd",
			icon: "✅",
			intro: `Hoi ${reservation.klant}, je reservatie is bevestigd! Hieronder een overzicht.`,
			detailsMessage
		},

		"bevestigingsmail"

	);

}


/**
 * Best-effort notice to the customer that their reservation request was
 * declined.
 * @param {Object} reservation
 */
export async function notifyCustomerOfRejection(reservation) {

	await sendCustomerStatusEmail(

		reservation,

		{
			heading: "Aanvraag geweigerd",
			icon: "❌",
			intro: `Hoi ${reservation.klant}, helaas kunnen we je reservatieaanvraag niet inwilligen.`,
			detailsMessage:
				"Dit kan bijvoorbeeld zijn omdat het materiaal niet beschikbaar is in deze periode. " +
				"Heb je vragen of wil je een andere periode voorstellen? Antwoord gerust op deze e-mail, we helpen je graag verder."
		},

		"weigeringsmail"

	);

}
