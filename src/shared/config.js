import { DEFAULT_REPOSITORY_MODE } from './constants.js';

export const appConfig = Object.freeze({

    repositoryMode: DEFAULT_REPOSITORY_MODE,

    supabaseUrl: "https://zlzluhqycboyxyvsbsmy.supabase.co",

    supabaseKey: "sb_publishable_ixhvo5M26RhzBMJYxOAO3A_d1_xvnO3",

    // From your EmailJS account (Account > General for the public key,
    // Email Services / Email Templates for the other two). The public
    // key is meant to be exposed client-side, same as the Supabase key
    // above — it is not a secret.
    emailjs: {
        publicKey: "I271SFi88DK0c2fS7",
        serviceId: "service_tgfsv5t",
        // Template used to notify admins of a new reservation (fixed "To Email" list).
        newReservationTemplateId: "template_od9k1ef",
        // Shared "customer status update" template — used for both the
        // booking confirmation and a rejection notice (EmailJS's free plan
        // caps templates at 2, so this one template's heading/icon/intro/
        // details_message vary per send instead of using separate templates).
        // Its "To Email" field must be set to {{to_email}} in the EmailJS
        // dashboard, since the recipient is the customer, not a fixed address.
        confirmationTemplateId: "template_j89dfth"
    },

    // Betaling gebeurt via handmatige overschrijving, geen online betaalprovider.
    payment: {
        iban: "BE57 7343 5310 2035"
    }

});