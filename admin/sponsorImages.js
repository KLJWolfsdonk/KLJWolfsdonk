import { supabase }
from "../src/shared/supabase.js";


export const SPONSOR_LOGO_BUCKET = "sponsor-logos";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;


export async function uploadSponsorLogo(file) {

	if (!file) {
		return null;
	}


	if (file.size > MAX_IMAGE_BYTES) {

		throw new Error("Logo is te groot (max 5 MB).");

	}


	const extension =
		file.name.includes(".")
			? file.name.split(".").pop()
			: "jpg";

	const path = `${crypto.randomUUID()}.${extension}`;


	const { error: uploadError } =
		await supabase.storage
			.from(SPONSOR_LOGO_BUCKET)
			.upload(path, file, { upsert: false });


	if (uploadError) {
		throw uploadError;
	}


	const { data } =
		supabase.storage
			.from(SPONSOR_LOGO_BUCKET)
			.getPublicUrl(path);


	return data.publicUrl;

}




function storagePathFromUrl(url) {

	const marker = `/${SPONSOR_LOGO_BUCKET}/`;

	const index = url.indexOf(marker);

	if (index === -1) {
		return null;
	}

	return decodeURIComponent(
		url.slice(index + marker.length)
	);

}




export async function deleteSponsorLogo(url) {

	const path = storagePathFromUrl(url);

	if (!path) {
		return;
	}


	const { error } =
		await supabase.storage
			.from(SPONSOR_LOGO_BUCKET)
			.remove([path]);


	if (error) {

		console.error(
			"Kon logo niet verwijderen uit storage:",
			error
		);

	}

}
