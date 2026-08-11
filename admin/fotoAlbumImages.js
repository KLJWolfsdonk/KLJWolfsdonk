import { supabase }
from "../src/shared/supabase.js";


export const FOTO_ALBUM_BUCKET = "foto-albums";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;


export async function uploadFotoAlbumImage(file) {

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
			.from(FOTO_ALBUM_BUCKET)
			.upload(path, file, { upsert: false });


	if (uploadError) {
		throw uploadError;
	}


	const { data } =
		supabase.storage
			.from(FOTO_ALBUM_BUCKET)
			.getPublicUrl(path);


	return data.publicUrl;

}




function storagePathFromUrl(url) {

	const marker = `/${FOTO_ALBUM_BUCKET}/`;

	const index = url.indexOf(marker);

	if (index === -1) {
		return null;
	}

	return decodeURIComponent(
		url.slice(index + marker.length)
	);

}




export async function deleteFotoAlbumImage(url) {

	const path = storagePathFromUrl(url);

	if (!path) {
		return;
	}


	const { error } =
		await supabase.storage
			.from(FOTO_ALBUM_BUCKET)
			.remove([path]);


	if (error) {

		console.error(
			"Kon afbeelding niet verwijderen uit storage:",
			error
		);

	}

}
