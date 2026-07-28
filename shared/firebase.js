/**
 * Centrale Firebase-configuratie voor de verhuurmodule.
 * Vul deze waarden later aan met de Firebase projectgegevens van KLJ Wolfsdonk.
 */
export const firebaseConfig = {
	apiKey: '',
	authDomain: '',
	projectId: '',
	storageBucket: '',
	messagingSenderId: '',
	appId: '',
};

export function getFirebaseConfig() {
	return { ...firebaseConfig };
}
