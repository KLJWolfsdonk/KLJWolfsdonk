/**
 * Turns a plain YouTube or Vimeo URL (whatever an admin would naturally
 * copy-paste — a "watch" link, a youtu.be short link, a vimeo.com link, or
 * an already-embed URL) into the correct iframe embed URL. Returns null for
 * anything unrecognized, so the caller can fall back to a plain link
 * instead of rendering a broken iframe.
 * @param {string} url
 * @returns {string | null}
 */
export function toEmbedUrl(url) {

	if (!url || typeof url !== 'string') {
		return null;
	}

	let parsed;

	try {
		parsed = new URL(url.trim());
	}
	catch {
		return null;
	}

	const host = parsed.hostname.replace(/^www\./, '');

	if (host === 'youtube.com' || host === 'm.youtube.com') {

		if (parsed.pathname === '/watch') {
			const id = parsed.searchParams.get('v');
			return id ? `https://www.youtube.com/embed/${id}` : null;
		}

		if (parsed.pathname.startsWith('/embed/')) {
			return `https://www.youtube.com${parsed.pathname}`;
		}

		return null;
	}

	if (host === 'youtu.be') {
		const id = parsed.pathname.replace(/^\//, '');
		return id ? `https://www.youtube.com/embed/${id}` : null;
	}

	if (host === 'vimeo.com') {
		const id = parsed.pathname.replace(/^\//, '');
		return /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
	}

	if (host === 'player.vimeo.com') {
		return parsed.href;
	}

	return null;

}
