-- Run in the Supabase SQL Editor.
--
-- WHAT THIS ADDS
-- ----------------
-- Low-code CMS for the Leiding (team roster) page — explicitly deferred in
-- sql/pages_phase3.sql ("a separate, much bigger project"). Now in scope.
--
-- - leiding_groepen: the tabs on the Leiding page (Wolfkes, Girry's, ...).
--   Fully admin-manageable: add/rename/reorder/delete groups, each with an
--   optional group photo.
-- - leiding_leden: the members within a group, each with the full set of
--   fields the old leiding.json had (bijnaam, geboorte, gsm, studie, werk,
--   eten, spel, taken) plus a photo. Cascade-deletes when its group is
--   removed.
--
-- Seeded with every existing entry from leiding.json so nothing changes
-- visually — new entries later go through a Storage upload, but the seeded
-- ones keep pointing at the already-deployed assets/img/leiding files.
-- This seed also fixes a longstanding bug in the old jQuery renderer: an
-- off-by-one in the group-id array meant "Vliegende Leiding" was rendered
-- into a hidden #aspis pane with no nav link, so that group was never
-- actually reachable on the live site. It now gets its own real group.
--
-- After running this, also create a public Storage bucket in the
-- dashboard: "leiding-fotos" — this file adds its RLS policies below, same
-- two-step process as "sponsor-logos"/"foto-albums".

create table if not exists leiding_groepen (
	id uuid primary key default gen_random_uuid(),
	naam text not null,
	groep_foto_url text,
	sort_order integer not null default 0,
	created_at timestamptz not null default now()
);

create index if not exists leiding_groepen_sort_order_idx on leiding_groepen (sort_order);

alter table leiding_groepen enable row level security;

revoke insert, update, delete on leiding_groepen from anon;
grant select on leiding_groepen to anon;

grant select, insert, update, delete on leiding_groepen to authenticated;

drop policy if exists "anon read leiding_groepen" on leiding_groepen;
create policy "anon read leiding_groepen"
	on leiding_groepen
	for select
	to anon
	using (true);

drop policy if exists "authenticated full access leiding_groepen" on leiding_groepen;
create policy "authenticated full access leiding_groepen"
	on leiding_groepen
	for all
	to authenticated
	using (true)
	with check (true);


create table if not exists leiding_leden (
	id uuid primary key default gen_random_uuid(),
	groep_id uuid not null references leiding_groepen(id) on delete cascade,
	sort_order integer not null default 0,
	voornaam text not null,
	achternaam text,
	bijnaam text,
	geboorte text,
	gsm text,
	studie text,
	werk text,
	eten text,
	spel text,
	taken text[] not null default '{}',
	foto_url text,
	created_at timestamptz not null default now()
);

create index if not exists leiding_leden_groep_id_idx on leiding_leden (groep_id);
create index if not exists leiding_leden_sort_order_idx on leiding_leden (sort_order);

alter table leiding_leden enable row level security;

revoke insert, update, delete on leiding_leden from anon;
grant select on leiding_leden to anon;

grant select, insert, update, delete on leiding_leden to authenticated;

drop policy if exists "anon read leiding_leden" on leiding_leden;
create policy "anon read leiding_leden"
	on leiding_leden
	for select
	to anon
	using (true);

drop policy if exists "authenticated full access leiding_leden" on leiding_leden;
create policy "authenticated full access leiding_leden"
	on leiding_leden
	for all
	to authenticated
	using (true)
	with check (true);


-- Storage RLS for the new bucket (create the bucket itself in the
-- dashboard first).
drop policy if exists "public read leiding-fotos" on storage.objects;
create policy "public read leiding-fotos"
	on storage.objects
	for select
	to public
	using (bucket_id = 'leiding-fotos');

drop policy if exists "authenticated manage leiding-fotos" on storage.objects;
create policy "authenticated manage leiding-fotos"
	on storage.objects
	for all
	to authenticated
	using (bucket_id = 'leiding-fotos')
	with check (bucket_id = 'leiding-fotos');


-- Eenmalige data-migratie: leiding.json -> leiding_groepen / leiding_leden.
-- Enkel uitgevoerd als leiding_groepen nog helemaal leeg is, dus dit blok
-- kan veilig herhaald worden.
with new_groepen as (
	insert into leiding_groepen (naam, groep_foto_url, sort_order)
	select * from (values
		('Wolfkes', 'assets/img/leiding/Wolfkes_leiding.jpg', 10),
		('Girry''s', 'assets/img/leiding/Girry_leiding.jpg', 20),
		('Squirrels', 'assets/img/leiding/Squirrel_leiding.jpg', 30),
		('Skunks', 'assets/img/leiding/Skunk_leiding.jpg', 40),
		('Waspi''s & Aspi''s', 'assets/img/leiding/Waspis_Aspis_leiding.jpg', 50),
		('Vliegende Leiding', 'assets/img/leiding/Vliegende_leiding.jpg', 60)
	) as seed(naam, groep_foto_url, sort_order)
	where not exists (select 1 from leiding_groepen)
	returning id, naam
)
insert into leiding_leden (
	groep_id, sort_order, voornaam, achternaam, bijnaam, geboorte, gsm,
	studie, werk, eten, spel, taken, foto_url
)
select g.id, m.sort_order, m.voornaam, m.achternaam, m.bijnaam, m.geboorte,
	m.gsm, m.studie, m.werk, m.eten, m.spel, m.taken, m.foto_url
from (values

	-- Wolfkes
	('Wolfkes', 10, 'Free', 'Mannaerts', null, '19/09/2008', null, 'Wetenschappen-Wiskunde', null, 'sushi', 'quiz', array[]::text[], 'assets/img/leiding/free2526.jpg'),
	('Wolfkes', 20, 'Jana', 'Pauwels', '/', '18/11/2005', '468 46 24 81', 'wiskunde', null, 'hesp/prei en kaassaus', 'pleinspelletjes', array[]::text[], 'assets/img/leiding/jana.jpg'),
	('Wolfkes', 30, 'Jari', 'Wynants', 'Karper', '05/08/2005', '0472805694', 'financieën en verzekeringen', null, 'Tagliatelle met brocoli, scampi en zalm', 'bosspel', array[]::text[], 'assets/img/leiding/jari2526.jpeg'),
	('Wolfkes', 40, 'Vic', 'Siongers', null, '27/12/2003', null, 'Orthopedagogische begeleiding', null, 'ribbekes', 'bosspel', array[]::text[], 'assets/img/leiding/vic2526.jpg'),

	-- Girry's
	('Girry''s', 10, 'Josefien', 'Verdonck', 'Joske', '17/10/2005', null, 'Verpleegkunde', null, 'Sushi/Pasta pesto', 'Quiz', array[]::text[], 'assets/img/leiding/jos.jpg'),
	('Girry''s', 20, 'Tibo', 'Mertens', 'titi', '17/01/2004', '0468 14 85 95', 'Muziek', null, 'Lasagne', 'ruwe pleinspelen', array[]::text[], 'assets/img/leiding/tibo.jpg'),
	('Girry''s', 30, 'Frauke', 'Janssens', 'Frakke', '16/07/2002', null, 'Orthopedagogische begeleiding', null, 'Alles met courgette', 'Competitieve spelletjes', array[]::text[], 'assets/img/leiding/frauke.jpg'),
	('Girry''s', 40, 'Nore', 'Zeelmaekers', null, '11/01/2008', null, 'Opvoeding en begeleiding', null, 'Frietjes', 'Ruwe pleinspelen', array[]::text[], 'assets/img/leiding/Nore_zeelmaekers.jpeg'),

	-- Squirrels
	('Squirrels', 10, 'Emilie', 'Faes', null, '22/12/2008', null, 'Humane Wetenschappen', null, 'Videe', 'Ruwe pleinspelen', array[]::text[], 'assets/img/leiding/Emilie2526.jpeg'),
	('Squirrels', 20, 'Martha', 'Pelgrims', null, '30/05/2008', null, 'Moderne Talen', null, 'sushi', 'Robin Hood/quiz', array[]::text[], 'assets/img/leiding/martha2526.jpg'),
	('Squirrels', 30, 'Senne', 'Achternaam', 'Seke', '04/04/2007', null, 'school', null, 'lekker', 'kaktus bloem', array[]::text[], 'assets/img/leiding/senne.jpg'),
	('Squirrels', 40, 'Warre', 'Van Dijck', 'sien', '23/03/2004', null, 'Industrieel ingenieur', null, 'Frietjes', 'Wedden dat', array[]::text[], 'assets/img/leiding/warre.jpg'),

	-- Skunks
	('Skunks', 10, 'Louis', 'Schaaf', 'Schaaf', '09/10/2001', '0483110782', 'Industrieel ingenieur', null, 'kapsalon pita', 'kampen bouwen in het bos', array['Hoofdleiding'], 'assets/img/leiding/louis.jpg'),
	('Skunks', 20, 'Liselot', 'Boeckx', 'Lotje', '31/10/2006', null, 'Revalidatiewetenschappen en kinesitherapie', null, 'Pasta, pizza, sushi', 'ruwe pleinspelen', array['Hoofdleiding'], 'assets/img/leiding/liselot.jpeg'),

	-- Waspi's & Aspi's
	('Waspi''s & Aspi''s', 10, 'Anna', 'Everaerts', null, '03/01/2007', null, 'vroedkunde', null, 'Macaroni', 'Pleinspelen', array[]::text[], 'assets/img/leiding/Placeholder-Female.jpg'),
	('Waspi''s & Aspi''s', 20, 'Jarne', 'Van de Velde', null, '24/10/2003', '0468405455', 'Planner containers maes', null, 'vlees', 'tikkertje', array[]::text[], 'assets/img/leiding/jarne.jpg'),
	('Waspi''s & Aspi''s', 30, 'Lotteke', 'Jennes', null, '22/11/2004', null, 'Verpleegkunde, ucll', null, 'pasta pesto', 'dorpspel en estafette', array[]::text[], 'assets/img/leiding/Lotteke2526.jpg'),
	('Waspi''s & Aspi''s', 40, 'Louise', 'Verdonck', null, '27/09/2003', null, null, 'Ik studeer niet meer maar ik ben Medisch Laborant 💩🔬🧫', 'Spaghetti carbonara van oudleider wuttel', 'Een goeie stevige wandeltocht 🥾', array[]::text[], 'assets/img/leiding/louise.jpg'),

	-- Vliegende Leiding
	('Vliegende Leiding', 10, 'Xanty', 'Vandezande', 'scampi', '03/04/2002', null, 'BanaBa Advanced Business Management Digital Supply Chain', null, 'Spinaziepuree met spekjes, zalm en een hardgekookt eitje.', 'stadsspel', array[]::text[], 'assets/img/leiding/xanty.jpg'),
	('Vliegende Leiding', 20, 'Noortje', 'Verbruggen', null, 'jaren 60', null, null, 'iets met klinische studies', 'pizza', 'pleinspelen', array[]::text[], 'assets/img/leiding/noortje.jpg')

) as m(
	groep_naam, sort_order, voornaam, achternaam, bijnaam, geboorte, gsm,
	studie, werk, eten, spel, taken, foto_url
)
join new_groepen g on g.naam = m.groep_naam;
