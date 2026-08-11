import { postService }
from "../../src/services/PostService.js";

import { escapeHtml }
from "../../src/shared/helpers.js";


function formatDate(datum) {

	if (!datum) {
		return "";
	}

	const date = new Date(datum);

	if (Number.isNaN(date.getTime())) {
		return datum;
	}

	return date.toLocaleDateString("nl-BE", {
		day: "numeric",
		month: "long",
		year: "numeric"
	});

}


function renderPost(post) {

	const sanitizedContent =
		typeof DOMPurify !== "undefined"
			? DOMPurify.sanitize(post.inhoud)
			: post.inhoud;

	return `
		<article class="post-card">

			${post.coverAfbeelding
				? `<img src="${escapeHtml(post.coverAfbeelding)}" alt="${escapeHtml(post.titel)}" class="post-card-cover" style="width: ${post.coverAfbeeldingBreedte ?? 100}%;">`
				: ""
			}

			<p class="post-card-date">${escapeHtml(formatDate(post.datum))}</p>
			<h3>${escapeHtml(post.titel)}</h3>
			<div class="post-card-content">${sanitizedContent}</div>

		</article>
	`;

}


export async function loadPosts(containerId, page = "home") {

	const container =
		document.getElementById(containerId);

	if (!container) {
		return;
	}


	try {

		const posts =
			await postService.getAll(page);


		if (!posts || posts.length === 0) {

			container.innerHTML = `<p class="text-muted">Nog geen nieuwsberichten.</p>`;

			return;

		}


		container.innerHTML =
			posts.map(renderPost).join("");

	}
	catch (error) {

		console.error(
			"Kon nieuws niet laden:",
			error
		);

		container.innerHTML = `<p class="text-muted">Kon nieuws niet laden. Probeer het later opnieuw.</p>`;

	}

}


loadPosts("posts-list", "home");
