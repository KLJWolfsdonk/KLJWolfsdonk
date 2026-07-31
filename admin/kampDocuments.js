import { supabase }
from "../src/shared/supabase.js";


export const KAMP_DOCUMENT_BUCKET = "kamp-documents";

const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;


export async function uploadKampDocument(file) {

	if (!file) {
		return null;
	}


	if (file.size > MAX_DOCUMENT_BYTES) {

		throw new Error("Bestand is te groot (max 20 MB).");

	}


	const extension =
		file.name.includes(".")
			? file.name.split(".").pop()
			: "pdf";

	const path = `${crypto.randomUUID()}.${extension}`;


	const { error: uploadError } =
		await supabase.storage
			.from(KAMP_DOCUMENT_BUCKET)
			.upload(path, file, { upsert: false });


	if (uploadError) {
		throw uploadError;
	}


	const { data } =
		supabase.storage
			.from(KAMP_DOCUMENT_BUCKET)
			.getPublicUrl(path);


	return data.publicUrl;

}




function storagePathFromUrl(url) {

	const marker = `/${KAMP_DOCUMENT_BUCKET}/`;

	const index = url.indexOf(marker);

	if (index === -1) {
		return null;
	}

	return decodeURIComponent(
		url.slice(index + marker.length)
	);

}




export async function deleteKampDocument(url) {

	const path = storagePathFromUrl(url);

	if (!path) {
		return;
	}


	const { error } =
		await supabase.storage
			.from(KAMP_DOCUMENT_BUCKET)
			.remove([path]);


	if (error) {

		console.error(
			"Kon bestand niet verwijderen uit storage:",
			error
		);

	}

}
