-- Run in the Supabase SQL Editor.
--
-- WHAT THIS ADDS
-- ----------------
-- Low-code CMS phase 3: Over, Activiteiten, Foto's, Contact, Sponsors.
-- ("Leiding", the member roster, is a separate, much bigger project —
-- explicitly out of scope here.)
--
-- - posts.page gets a third allowed value, 'activiteiten', so the dead
--   "Specialere activiteiten" section (currently hand-edited/commented-out
--   HTML) becomes an ordinary posts feed, same as Home/Kamp.
-- - page_sections: generic named rich-text blocks, for the handful of
--   fixed prose blocks (Over's 3 tabs, Activiteiten's intro, Contact's
--   intro) that aren't a repeating feed.
-- - site_settings: one shared clubhouse address, since Over/Praktisch and
--   Contact currently embed the exact same map independently.
-- - foto_albums / sponsors: the two hardcoded photo grids become
--   admin-manageable lists. Seeded with every existing entry so nothing
--   changes visually — new entries later go through Storage uploads, but
--   the seeded ones keep pointing at the already-deployed assets/img files.
--
-- After running this, also create two public Storage buckets in the
-- dashboard: "foto-albums" and "sponsor-logos" — this file adds their RLS
-- policies below, same two-step process as "post-images"/"kamp-documents".

do $$
begin
	if exists (select 1 from pg_constraint where conname = 'posts_page_check') then
		alter table posts drop constraint posts_page_check;
	end if;
	alter table posts
		add constraint posts_page_check
		check (page in ('home', 'kamp', 'activiteiten'));
end $$;


create table if not exists page_sections (
	id uuid primary key default gen_random_uuid(),
	page text not null,
	section_key text not null,
	title text,
	content text not null default '',
	updated_at timestamptz not null default now(),
	unique (page, section_key)
);

alter table page_sections enable row level security;

revoke insert, update, delete on page_sections from anon;
grant select on page_sections to anon;

grant select, insert, update, delete on page_sections to authenticated;

drop policy if exists "anon read page_sections" on page_sections;
create policy "anon read page_sections"
	on page_sections
	for select
	to anon
	using (true);

drop policy if exists "authenticated full access page_sections" on page_sections;
create policy "authenticated full access page_sections"
	on page_sections
	for all
	to authenticated
	using (true)
	with check (true);


create table if not exists site_settings (
	id uuid primary key default gen_random_uuid(),
	location_address text,
	updated_at timestamptz not null default now()
);

alter table site_settings enable row level security;

revoke insert, update, delete on site_settings from anon;
grant select on site_settings to anon;

grant select, insert, update, delete on site_settings to authenticated;

drop policy if exists "anon read site_settings" on site_settings;
create policy "anon read site_settings"
	on site_settings
	for select
	to anon
	using (true);

drop policy if exists "authenticated full access site_settings" on site_settings;
create policy "authenticated full access site_settings"
	on site_settings
	for all
	to authenticated
	using (true)
	with check (true);


create table if not exists foto_albums (
	id uuid primary key default gen_random_uuid(),
	titel text not null,
	cover_image_url text not null,
	link text,
	sort_order integer not null default 0,
	created_at timestamptz not null default now()
);

create index if not exists foto_albums_sort_order_idx on foto_albums (sort_order);

alter table foto_albums enable row level security;

revoke insert, update, delete on foto_albums from anon;
grant select on foto_albums to anon;

grant select, insert, update, delete on foto_albums to authenticated;

drop policy if exists "anon read foto_albums" on foto_albums;
create policy "anon read foto_albums"
	on foto_albums
	for select
	to anon
	using (true);

drop policy if exists "authenticated full access foto_albums" on foto_albums;
create policy "authenticated full access foto_albums"
	on foto_albums
	for all
	to authenticated
	using (true)
	with check (true);


create table if not exists sponsors (
	id uuid primary key default gen_random_uuid(),
	naam text not null,
	logo_url text not null,
	link text,
	sort_order integer not null default 0,
	created_at timestamptz not null default now()
);

create index if not exists sponsors_sort_order_idx on sponsors (sort_order);

alter table sponsors enable row level security;

revoke insert, update, delete on sponsors from anon;
grant select on sponsors to anon;

grant select, insert, update, delete on sponsors to authenticated;

drop policy if exists "anon read sponsors" on sponsors;
create policy "anon read sponsors"
	on sponsors
	for select
	to anon
	using (true);

drop policy if exists "authenticated full access sponsors" on sponsors;
create policy "authenticated full access sponsors"
	on sponsors
	for all
	to authenticated
	using (true)
	with check (true);


-- Storage RLS for the two new buckets (create the buckets themselves in
-- the dashboard first).
drop policy if exists "public read foto-albums" on storage.objects;
create policy "public read foto-albums"
	on storage.objects
	for select
	to public
	using (bucket_id = 'foto-albums');

drop policy if exists "authenticated manage foto-albums" on storage.objects;
create policy "authenticated manage foto-albums"
	on storage.objects
	for all
	to authenticated
	using (bucket_id = 'foto-albums')
	with check (bucket_id = 'foto-albums');

drop policy if exists "public read sponsor-logos" on storage.objects;
create policy "public read sponsor-logos"
	on storage.objects
	for select
	to public
	using (bucket_id = 'sponsor-logos');

drop policy if exists "authenticated manage sponsor-logos" on storage.objects;
create policy "authenticated manage sponsor-logos"
	on storage.objects
	for all
	to authenticated
	using (bucket_id = 'sponsor-logos')
	with check (bucket_id = 'sponsor-logos');


-- Seed site_settings (one shared clubhouse address).
insert into site_settings (location_address)
select 'Weybroekstraat 2A, 3201 Wolfsdonk'
where not exists (select 1 from site_settings);


-- Seed page_sections with today's actual text, so nothing changes visually
-- until an admin edits it through the new admin pages.
insert into page_sections (page, section_key, title, content)
select * from (values

	('over', 'praktisch', 'Praktische info', $$
<p>
	KLJ Wolfsdonk is een toffe bende die elke week een heel avontuur klaarstoomt voor uw kleine of al net iets minder kleine rakker.
	<br>Mail ons als je je nog wilt inschrijven!. Onze werking is verdeeld in zes leeftijdsgroepen:
</p>
<ul>
	<li><strong>Wolfkes:</strong> van 6 tot 8 jaar, dus 1e en 2e leerjaar;</li>
	<li><strong>Girry's:</strong> van 8 tot 10 jaar, dus 3e en 4e leerjaar;</li>
	<li><strong>Squirrels:</strong> van 10 tot 12 jaar, dus 5e en 6e leerjaar;</li>
	<li><strong>Skunks:</strong> van 12 jaar tot 14 jaar, dus 1e en 2e middelbaar;</li>
	<li><strong>Waspi's</strong>: van 14 jaar tot 16 jaar, dus 3e en 4e middelbaar;</li>
	<li><strong>Aspi's:</strong> vanaf 16 jaar, dus vanaf het 5e middelbaar.</li>
</ul>
<p>
	Afhankelijk van het aantal leden kunnen de groepen in het begin van elk werkjaar wel wat aangepast worden. Het is bovendien ook
	steeds mogelijk om uw kind in een jongere leeftijdsgroep te plaatsen, als u of uw kind dat wenst. Voor meer informatie over de
	(groeps)leiding kan u <a class="internalLink" href="#leiding" title="Klik hier">hier</a> terecht.
</p>
<h4>Prijzen</h4>
<ul>
	<li>Inschrijving 1e lid - 60 euro</li>
	<li>Zomerlid vanaf 15 maart - 30 euro</li>
	<li>Pull - 25 euro</li>
	<li>T-Shirt - 15 euro</li>
	<li>Nieuw sjaaltje - 5 euro</li>
</ul>
<p>We bieden ook tweedehands KLJ-kleding aan lagere prijzen. Voor meer informatie kan je de leiding aanspreken voor of na een activiteit.</p>
<p>Rekeningnummer KLJ: <u>BE57 7343 5310 2035</u></p>
<h4>Jaarkalender</h4>
<p>Je kan de jaarkalender makkelijk toevoegen aan je google agenda via <a href="https://calendar.google.com/calendar/u/0?cid=a2xqd29sZnNkb25rQGhvdG1haWwuY29t">deze link</a>.</p>
<h4>Waar &amp; wanneer?</h4>
<p>Alle groepen beginnen aan ons lokaaltje om 14u en eindigen om 17u.</p>
<p>
	Onze afdeling bevindt zich in het gewest Demerland.<br>
	Ons lokaaltje is gelegen tegenover de Wolfdonkse bibliotheek en heeft het volgende adres:
</p>
<p>
	Weybroekstraat 2A<br>
	3201 Wolfsdonk
</p>
$$),

	('over', 'klj', 'KLJ Wolfsdonk?', $$
<p>
	Zijn jouw zaterdagen ook altijd zo lang en saai?<br>
	Verveel jij je elk weekend weer, zit je de hele dag te suffen achter jouw computer?<br>
	Wil jij ook iets meer halen uit die zaterdag?<br>
	Rep je dan als de bliksem naar <span class="highlight">KLJ WOLFSDONK</span>!
</p>
<h4>KLJ wablief?!</h4>
<p>
	KLJ Wolfsdonk natuurlijk!<br>
	KLJ Wolfsdonk is een te gekke bende van kinderen en jongeren tussen 6 en 26 jaar.<br>
	Elke zaterdag kan je ons vinden in Wolfsdonk en omstreken, waar we het hele dorp op stelten zetten met onze knotsgekke activiteiten!
</p>
<h4>Voor wie?</h4>
<p>
	KLJ is er voor iedereen, en dus ook voor jou!<br>
	Wij, van KLJ Wolfsdonk, zijn verdeeld in zes leeftijdsgroepen: Wolfkes, Girry's, Squirrels, Skunks, Waspi's en Aspi's. Elke keer
	opnieuw serveren onze leiders en leidsters alle zes de leeftijdsgroepen een activiteit om nooit meer te vergeten.<br>
	Want bij KLJ Wolfsdonk krijg je vlees op je bord, puur en onversneden!
</p>
<h4>Nieuwsgierig?</h4>
<p>
	Hongerig naar meer?<br>
	Klik dan op 'Praktisch' om alles te weten te komen over wie we zijn, wat we doen, wanneer we het doen, en hoe we het doen!
</p>
$$),

	('over', 'extra', 'Extra info', $$
<p>
	KLJ Wolfsdonk is een dolenthousiaste jeugdbeweging die elke zaterdag weer een spetterende activiteit in elkaar bokst. Maar, KLJ is
	nog veel meer dan een jeugdbeweging alleen! Laten we even een verfrissende duik nemen in het hele KLJ-gebeuren.
</p>
<h4>De KLJ</h4>
<p>
	<img style="float: right" src="assets/img/kljWolfsdonk_logo.png" alt="" width="150" height="171"> KLJ staat voor Katholieke
	Landelijke Jeugd en bestaat al sinds 1927. Dat wil zeggen dat we dit jaar ons 96ste kaarsje mogen uitblazen!<br>
	In onze 280 afdelingen komen er gemiddeld zo'n 30 000 jongeren bijeen. Dit maakt KLJ één van de grote jeugdbewegingen, en de
	grootste jongerenbeweging in Vlaanderen.
</p>
<p>KLJ richt zich ook op drie grote doelen:</p>
<ul>
	<li>jonge mensen samenbrengen;</li>
	<li>werken aan persoonlijke vorming én de groepsvorming van de leden;</li>
	<li>meewerken aan de opbouw van de samenleving.</li>
</ul>
<p>
	Hierbij komt ook het werkthema 'KLJ voor iedereen'. KLJ voor iedereen houdt in dat KLJ wil openstaan voor alle kinderen en
	jongeren. Of je nu arm bent of rijk, groot of klein, of lijdt aan een handicap: bij KLJ Wolfsdonk is iedereen welkom!
</p>
<p>
	Elke week opnieuw werkt de vertrouwde leiding aan deze doelen, met de hulp van een hele reeks inhoudelijke en methodische
	speerpunten. Zo brengt KLJ Wolfsdonk niet alleen berg plezier voor de kinderen, maar leren de leden ook wat bij. Zo leren ze
	meedraaien in hun eigen kleine maatschappij: sociale vaardigheden zijn in de huidige samenleving immers belangrijker dan ooit!
</p>
<h4>Historiek</h4>
<p>
	Toen in 1927 de BJB (Boerenjeugdbond) opgericht werd, was KLJ Wolfsdonk hierin een van de voortrekkers. Anders gezegd; KLJ
	Wolfsdonk is dus <span class="highlight">één van de oudste KLJ's in het land!</span> De BJB was eigenlijk de huidige KLJ, maar de naam Katholieke
	Landelijke Jeugd kwam pas in het jaar 1965 aangedraafd.<br>
	KLJ Wolfsdonk zelf is pas echt beginnen groeien halverwege de jaren '80.
</p>
$$),

	('activiteiten', 'uitleg', 'Uitleg', $$
<p>
	Elke zaterdag vanaf onze startdag 16 september tot de winterpauze zaterdag 16 december.
	Daar nemen we een activiteitenpauze zodat onze studerende medeleiding (de grote meerderheid) kan blokken.
</p>
<p>
	17 februari hervatten we de reguliere activiteiten tot en met 25 mei waar we wederom de blok moeten induiken.
</p>
<p>
	Er zitten zeker wat specialere activiteiten tussen, de 'speciaalste' vind je onderaan deze pagina,
	een paar kleinere worden doorheen het jaar gecommuniceerd.
</p>
<p>
	De Skunks en Waspi's zouden soms een avondactiviteit kunnen hebben,
	indien dit het geval is wordt dit ook op de gepaste manier gecommuniceerd naar de leden en ouders.
</p>
$$),

	('contact', 'intro', 'Contact', $$
<p>
	Voor vragen en opmerkingen, contacteer ons via <strong>kljwolfsdonk@hotmail.com</strong>
</p>
<p>
	Mocht je dringende vragen hebben, dan kan je onze hoofdleiders telefonisch bereiken:<br>
	Liselot: 0492 06 50 97<br>
	Louis: 0483 11 07 82<br>
	<br>
	Administratieve zaken:<br>
	Lotteke: 0474 18 81 41
</p>
$$)

) as seed(page, section_key, title, content)
where not exists (
	select 1 from page_sections
	where page_sections.page = seed.page
	and page_sections.section_key = seed.section_key
);


-- Seed foto_albums with all 25 existing hardcoded albums, newest first.
insert into foto_albums (titel, cover_image_url, link, sort_order)
select * from (values
	('Kamp Nieuwpoort 2025', 'assets/img/images/omslagfoto_kamp_2025.jpg', 'https://photos.app.goo.gl/oDaSNBgYYMp7hP6i9', 10),
	('Weekend Mol 2025', 'assets/img/images/omslagfoto_weekend.jpg', 'https://photos.app.goo.gl/irXit67SadDE6JP1A', 20),
	('Kamp Opoeteren 2024', 'assets/img/images/kamp_2024_groepsfoto.JPG', 'https://photos.app.goo.gl/1h7UUGfHsgJg2Lok6', 30),
	('Weekend Schriek 2024', 'assets/img/fotos/weekend2024.JPG', 'https://photos.app.goo.gl/SMcdN4RSHmmTU8ZX7', 40),
	('Buitenlands kamp Kroatië 2023', 'assets/img/fotos/buitenlands2023.jpg', 'https://photos.google.com/share/AF1QipNTZdD8dhXAGb08w2lpT_KMnkc_ZF-tCOswkd1_oQZ7EMmGMin1s24IivSmyIuWCg?key=eTNnVW9qUW10QjB6VW1HNHpoQmdva2NRVmxuaHRB', 50),
	('Kamp Hoge Rielen 2023', 'assets/img/fotos/kleintjeskamp%202023.jpg', 'https://photos.app.goo.gl/6bhJyoWuip7GSBHQA', 60),
	('Weekend Langdorp 2023', 'assets/img/fotos/weekend2023.jpg', 'https://photos.app.goo.gl/pTQr2jQgtQXuK6pY7', 70),
	('Kamp Ravels-Eel 2022', 'assets/img/fotos/kamp2022.jpg', 'https://photos.app.goo.gl/wCE1LCqgaJ6FLsdi7', 80),
	('Weekend Zutendaal 2022', 'assets/img/fotos/weekend2022.jpg', 'https://photos.app.goo.gl/VbYxzGTK2F8WfHPD8', 90),
	('Kamp Linkeroever 2021', 'assets/img/fotos/kamp2021.jpeg', 'https://photos.app.goo.gl/TZFTz25dLQdv1YPC6', 100),
	('Kamp Arendonk 2020', 'assets/img/fotos/kamp2020.jpg', 'https://photos.app.goo.gl/dm9NXiyXTSsgFYW99', 110),
	('Kamp Slowakije 2019', 'assets/img/fotos/kamp2019-2.jpg', 'https://photos.app.goo.gl/1xM5CAcL8QyJvdpU6', 120),
	('Kamp Sint-Truiden 2019', 'assets/img/fotos/kamp2019.jpg', 'https://photos.app.goo.gl/zLMWPcurr2PYmat68', 130),
	('Eindactiviteit 2019', 'assets/img/fotos/Eindactiviteit2019.jpg', 'https://photos.app.goo.gl/1Sqhiro2Tfy76qYc8', 140),
	('Weekend Balen 2019', 'assets/img/fotos/Weekend2019.jpg', 'https://photos.app.goo.gl/MxiGSY69YDHoeXuA9', 150),
	('Startdag Speelgoedwinkel 2018', 'assets/img/fotos/startdag2018.jpg', 'https://photos.app.goo.gl/QrJBP2H9KPqyHoaNA', 160),
	('Kamp Neerpelt 2018', 'assets/img/fotos/kamp2018.jpg', 'https://photos.app.goo.gl/RikUzWEAWSF1s1rU7', 170),
	('Weekend Arendonk 2018', 'assets/img/fotos/weekend2018.jpg', 'https://photos.app.goo.gl/SMPXyXFJiWnVPs1z2', 180),
	('Kamp Bornem 2017', 'assets/img/fotos/kamp2017.jpg', 'https://photos.app.goo.gl/WYJoEGyqPhufh3Dy2', 190),
	('Kamp Westmeerbeek 2016', 'assets/img/fotos/kamp2016.jpg', 'https://goo.gl/photos/HNfBfkZdV8BqJy1q6', 200),
	('Kamp Hongarije 2015', 'assets/img/fotos/kamp2015.jpg', 'https://photos.app.goo.gl/dMykR46m9JeEMEpA9', 210),
	('Startdag Jungle 2015', 'assets/img/fotos/startdag2015.jpg', 'https://photos.app.goo.gl/oAFRuDvNcP166RQf6', 220),
	('Kamp Meeuwen-Gruitrode 2014', 'assets/img/fotos/kamp2014.jpg', 'https://photos.app.goo.gl/VCPMeYKHegJL33By6', 230),
	('Kamp Tollembeek 2013', 'assets/img/fotos/kamp2013.jpg', 'https://photos.app.goo.gl/qHCaNmhdTPBURey89', 240),
	('Kamp Hoge Rielen 2012', 'assets/img/fotos/kamp2012.jpg', 'https://photos.app.goo.gl/AM67Q7opSSdAj6fb9', 250)
) as seed(titel, cover_image_url, link, sort_order)
where not exists (select 1 from foto_albums);


-- Seed sponsors with the 3 existing logos.
insert into sponsors (naam, logo_url, link, sort_order)
select * from (values
	('CERA', 'assets/img/images/sponsors/Logo_cera.jpg', null, 10),
	('Peters frietkot', 'assets/img/images/sponsors/petersfrietkot.jpeg', null, 20),
	('Meubelen PLU', 'assets/img/images/sponsors/meubelen_plu.jpg', null, 30)
) as seed(naam, logo_url, link, sort_order)
where not exists (select 1 from sponsors);
