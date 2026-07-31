-- Run in the Supabase SQL Editor.
--
-- WHAT THIS ADDS
-- ----------------
-- Low-code CMS phase 2: the #kamp page. Lets an admin write posts targeted
-- at the kamp page (reusing the existing posts table/UI — just a page
-- filter), set the aftermovie link and location address without touching
-- code, and manage a list of downloadable documents (kampboekje etc.).
--
-- After running this, also create a public "kamp-documents" Storage bucket
-- in the Supabase dashboard — this file only adds the RLS policies for it
-- (same two-step process as "post-images").

alter table posts
	add column if not exists page text not null default 'home';

do $$
begin
	if not exists (
		select 1 from pg_constraint where conname = 'posts_page_check'
	) then
		alter table posts
			add constraint posts_page_check
			check (page in ('home', 'kamp'));
	end if;
end $$;

create index if not exists posts_page_published_sort_order_idx
	on posts (page, published, sort_order);


create table if not exists kamp_settings (
	id uuid primary key default gen_random_uuid(),
	aftermovie_url text,
	location_address text,
	updated_at timestamptz not null default now()
);

alter table kamp_settings enable row level security;

revoke insert, update, delete on kamp_settings from anon;
grant select on kamp_settings to anon;

grant select, insert, update, delete on kamp_settings to authenticated;

drop policy if exists "anon read kamp_settings" on kamp_settings;
create policy "anon read kamp_settings"
	on kamp_settings
	for select
	to anon
	using (true);

drop policy if exists "authenticated full access kamp_settings" on kamp_settings;
create policy "authenticated full access kamp_settings"
	on kamp_settings
	for all
	to authenticated
	using (true)
	with check (true);

-- Seed one row with today's actual hardcoded values, so nothing changes
-- visually until an admin edits it through admin/kamp.html.
insert into kamp_settings (aftermovie_url, location_address)
select 'https://www.youtube.com/watch?v=tT-Tx5kbatg', 'z/n, Wipstraat, 3630 Maasmechelen'
where not exists (select 1 from kamp_settings);


create table if not exists kamp_documents (
	id uuid primary key default gen_random_uuid(),
	title text not null,
	file_url text not null,
	sort_order integer not null default 0,
	created_at timestamptz not null default now()
);

create index if not exists kamp_documents_sort_order_idx
	on kamp_documents (sort_order);

alter table kamp_documents enable row level security;

revoke insert, update, delete on kamp_documents from anon;
grant select on kamp_documents to anon;

grant select, insert, update, delete on kamp_documents to authenticated;

drop policy if exists "anon read kamp_documents" on kamp_documents;
create policy "anon read kamp_documents"
	on kamp_documents
	for select
	to anon
	using (true);

drop policy if exists "authenticated full access kamp_documents" on kamp_documents;
create policy "authenticated full access kamp_documents"
	on kamp_documents
	for all
	to authenticated
	using (true)
	with check (true);


-- Storage RLS for the "kamp-documents" bucket (create the bucket itself in
-- the dashboard first — marking it "Public" only allows downloads, not
-- uploads; uploads always go through the authenticated route and still
-- need a policy here regardless of the bucket's public/private flag).
drop policy if exists "public read kamp-documents" on storage.objects;
create policy "public read kamp-documents"
	on storage.objects
	for select
	to public
	using (bucket_id = 'kamp-documents');

drop policy if exists "authenticated manage kamp-documents" on storage.objects;
create policy "authenticated manage kamp-documents"
	on storage.objects
	for all
	to authenticated
	using (bucket_id = 'kamp-documents')
	with check (bucket_id = 'kamp-documents');
