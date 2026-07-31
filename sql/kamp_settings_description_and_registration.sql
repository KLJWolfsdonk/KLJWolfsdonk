-- Run in the Supabase SQL Editor.
--
-- WHAT THIS ADDS
-- ----------------
-- Lets an admin also edit the kamp page's intro description and
-- registration link (previously hardcoded in index.html) through
-- admin/kamp.html, same as the aftermovie/address settings already are.

alter table kamp_settings
	add column if not exists description text;

alter table kamp_settings
	add column if not exists registration_url text;

-- Backfill today's actual hardcoded values, so nothing changes visually
-- until an admin edits them.
update kamp_settings
set
	description = coalesce(description,
		'Kamp 2026: Wolven, girrys: 12/07-17/07. Squirrels, skunks, wapsis: 12/07-19/07. Aspis: 12/07-21/07 (gaan met de leiding jaar huis). Hebben jullie er al zin in? Wij ook! Om al in de sfeer te komen kan je de aftermovies van vorige jaren hier al bekijken!'
	),
	registration_url = coalesce(registration_url,
		'https://docs.google.com/forms/d/e/1FAIpQLScPLHq_gdkAbOYySMIglBnunh1Tosmz_yS1VLbCAbkegrSMMw/viewform?usp=dialog'
	);
