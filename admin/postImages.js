import { supabase }
from "../src/shared/supabase.js";


export const POST_IMAGE_BUCKET = "post-images";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;


export async function uploadPostImage(file) {

	if (!file) {
		return null;
	}


	if (file.size > MAX_IMAGE_BYTES) {

		throw new Error("Afbeelding is te groot (max 5 MB).");

	}


	const extension =
		file.name.includes(".")
			? file.name.split(".").pop()
			: "jpg";

	const path = `${crypto.randomUUID()}.${extension}`;


	const { error: uploadError } =
		await supabase.storage
			.from(POST_IMAGE_BUCKET)
			.upload(path, file, { upsert: false });


	if (uploadError) {
		throw uploadError;
	}


	const { data } =
		supabase.storage
			.from(POST_IMAGE_BUCKET)
			.getPublicUrl(path);


	return data.publicUrl;

}




function storagePathFromUrl(url) {

	const marker = `/${POST_IMAGE_BUCKET}/`;

	const index = url.indexOf(marker);

	if (index === -1) {
		return null;
	}

	return decodeURIComponent(
		url.slice(index + marker.length)
	);

}




export async function deletePostImages(urls) {

	const paths =
		(urls ?? [])
			.filter(Boolean)
			.map(storagePathFromUrl)
			.filter(Boolean);

	if (paths.length === 0) {
		return;
	}


	const { error } =
		await supabase.storage
			.from(POST_IMAGE_BUCKET)
			.remove(paths);


	if (error) {

		console.error(
			"Kon oude afbeeldingen niet verwijderen uit storage:",
			error
		);

	}

}
