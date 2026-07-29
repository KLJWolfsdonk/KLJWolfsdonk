import { supabase }
from "../src/shared/supabase.js";

import { productService }
from "../src/services/ProductService.js";


import { ProductManagerList }
from "./components/ProductManagerList.js";



const listContainer =
	document.getElementById(
		"product-manager-list"
	);


const logoutButton =
	document.getElementById(
		"logout-button"
	);


const form =
	document.getElementById(
		"product-form"
	);


const formError =
	document.getElementById(
		"product-form-error"
	);




let allProducts = [];

let productList;


const PRODUCT_IMAGE_BUCKET = "product-images";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;


async function uploadProductImage(file) {

	if (!file) {
		return null;
	}


	if (file.size > MAX_IMAGE_BYTES) {

		throw new Error("Foto is te groot (max 5 MB).");

	}


	const extension =
		file.name.includes(".")
			? file.name.split(".").pop()
			: "jpg";

	const path = `${crypto.randomUUID()}.${extension}`;


	const { error: uploadError } =
		await supabase.storage
			.from(PRODUCT_IMAGE_BUCKET)
			.upload(path, file, { upsert: false });


	if (uploadError) {
		throw uploadError;
	}


	const { data } =
		supabase.storage
			.from(PRODUCT_IMAGE_BUCKET)
			.getPublicUrl(path);


	return data.publicUrl;

}




async function uploadProductImages(files) {

	const urls = [];


	for (const file of files ?? []) {

		urls.push(await uploadProductImage(file));

	}


	return urls;

}




function storagePathFromUrl(url) {

	const marker = `/${PRODUCT_IMAGE_BUCKET}/`;

	const index = url.indexOf(marker);

	if (index === -1) {
		return null;
	}

	return decodeURIComponent(
		url.slice(index + marker.length)
	);

}




async function deleteProductImages(urls) {

	const paths =
		(urls ?? [])
			.map(storagePathFromUrl)
			.filter(Boolean);

	if (paths.length === 0) {
		return;
	}


	const { error } =
		await supabase.storage
			.from(PRODUCT_IMAGE_BUCKET)
			.remove(paths);


	if (error) {

		console.error(
			"Kon oude foto's niet verwijderen uit storage:",
			error
		);

	}

}




//
// AUTH GATE
//

const { data: { session } } =
	await supabase.auth.getSession();


if (!session) {

	window.location.replace("./login.html" + window.location.search);

}
else {

	logoutButton.hidden = false;

}


supabase.auth.onAuthStateChange((event, newSession) => {

	if (!newSession) {

		window.location.replace("./login.html");

	}

});


logoutButton.addEventListener(
	"click",
	async () => {

		await supabase.auth.signOut();

		window.location.replace("./login.html");

	}
);




async function loadProducts() {


	allProducts =
		await productService.getAllForAdmin();


	productList.render(
		allProducts
	);


}




productList =
	new ProductManagerList(

		listContainer,


		async (id, changes, imageFiles, keptImageUrls) => {


			const current =
				allProducts.find(
					product => product.id === id
				);


			if (!current) {
				return;
			}


			const uploadedUrls =
				await uploadProductImages(imageFiles);

			const afbeeldingen = [
				...keptImageUrls,
				...uploadedUrls
			];

			const removedUrls =
				current.afbeeldingen.filter(
					url => !keptImageUrls.includes(url)
				);


			await productService.update(
				id,
				{
					...current,
					...changes,
					afbeeldingen
				}
			);


			await deleteProductImages(removedUrls);


			await loadProducts();


		},


		async (id, actief) => {


			const current =
				allProducts.find(
					product => product.id === id
				);


			if (!current) {
				return;
			}


			await productService.update(
				id,
				{
					...current,
					actief
				}
			);


			await loadProducts();


		},


		async id => {

			const current =
				allProducts.find(
					product => product.id === id
				);

			try {

				await productService.delete(id);

			}
			catch (error) {

				if (error?.code === "23503") {

					throw new Error(
						"Dit product heeft nog reservaties in de geschiedenis en kan niet " +
						"permanent verwijderd worden. Gebruik 'Deactiveren' in plaats daarvan."
					);

				}

				throw error;

			}

			if (current) {

				await deleteProductImages(current.afbeeldingen);

			}

			await loadProducts();

		}

	);




function eurosToCents(value) {

	const parsed = parseFloat(value);

	return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;

}


form.addEventListener(
	"submit",
	async event => {


		event.preventDefault();

		formError.hidden = true;


		try {

			const fotoInput =
				document.getElementById("new-foto");

			const afbeeldingen =
				await uploadProductImages(fotoInput?.files);


			await productService.create({

				naam:
					document.getElementById("new-naam").value.trim(),

				categorie:
					document.getElementById("new-categorie").value.trim(),

				beschrijving:
					document.getElementById("new-beschrijving").value.trim(),

				prijsPerDag:
					eurosToCents(document.getElementById("new-prijs").value),

				waarborg:
					eurosToCents(document.getElementById("new-waarborg").value),

				voorraad:
					parseInt(document.getElementById("new-voorraad").value, 10) || 0,

				afbeeldingen,

				actief: true

			});


			form.reset();


			await loadProducts();

		}
		catch (error) {

			console.error(
				"Kon product niet toevoegen:",
				error
			);

			formError.textContent =
				`Kon product niet toevoegen: ${error.message}`;

			formError.hidden = false;

		}

	}
);




if (session) {

	loadProducts();

}
