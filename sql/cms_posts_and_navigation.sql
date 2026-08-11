-- Run in the Supabase SQL Editor.
--
-- WHAT THIS ADDS
-- ----------------
-- Low-code CMS v1: a "posts" feed (news/activity announcements, currently
-- hand-edited as HTML in index.html's #activiteiten section, which is why
-- it's all commented out today) and a "navigation_items" table so an admin
-- can add/rename/reorder/hide top-level navbar links without touching code.
--
-- Same RLS shape as products (see sql/security_hardening.sql): anon can
-- only read published/visible rows, authenticated (admin panel) has full
-- access.
--
-- After running this, also create a public "post-images" Storage bucket in
-- the Supabase dashboard (same as the undocumented "product-images" bucket
-- already in use — there's no SQL/policy file for that one either).

create table if not exists posts (
	id uuid primary key default gen_random_uuid(),
	title text not null,
	content text not null,
	cover_image text,
	published boolean not null default false,
	post_date date not null default current_date,
	author_email text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index if not exists posts_published_post_date_idx
	on posts (published, post_date desc);

alter table posts enable row level security;

revoke insert, update, delete on posts from anon;
grant select on posts to anon;

grant select, insert, update, delete on posts to authenticated;

drop policy if exists "anon read published posts" on posts;
create policy "anon read published posts"
	on posts
	for select
	to anon
	using (published = true);

drop policy if exists "authenticated full access posts" on posts;
create policy "authenticated full access posts"
	on posts
	for all
	to authenticated
	using (true)
	with check (true);


create table if not exists navigation_items (
	id uuid primary key default gen_random_uuid(),
	label text not null,
	href text not null,
	sort_order integer not null default 0,
	visible boolean not null default true,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index if not exists navigation_items_sort_order_idx
	on navigation_items (sort_order);

alter table navigation_items enable row level security;

revoke insert, update, delete on navigation_items from anon;
grant select on navigation_items to anon;

grant select, insert, update, delete on navigation_items to authenticated;

drop policy if exists "anon read visible navigation_items" on navigation_items;
create policy "anon read visible navigation_items"
	on navigation_items
	for select
	to anon
	using (visible = true);

drop policy if exists "authenticated full access navigation_items" on navigation_items;
create policy "authenticated full access navigation_items"
	on navigation_items
	for all
	to authenticated
	using (true)
	with check (true);


-- Seed the current hardcoded navbar links verbatim (same labels, hrefs and
-- order as the live <ul class="navbar-nav"> in index.html today — the
-- commented-out "Leiding" dropdown markup there is dead code, the live
-- version is a plain link), so the first deploy of the dynamic navbar looks
-- identical to today. "Nieuws" is the one new addition, appended at the
-- end. Sort-order values are spaced by 10 so items can be inserted between
-- existing ones later via the admin navigation manager.
insert into navigation_items (label, href, sort_order, visible)
select * from (values
	('Home', '#home', 10, true),
	('Praktische informatie', '#over', 20, true),
	('Leiding', '#leiding', 30, true),
	('Activiteiten', '#activiteiten', 40, true),
	('Kamp', '#kamp', 50, true),
	('Foto''s', '#fotos', 60, true),
	('Contact', '#contact', 70, true),
	('Sponsors', '#sponsors', 80, true),
	('Nieuws', '#nieuws', 90, true)
) as seed(label, href, sort_order, visible)
where not exists (select 1 from navigation_items);
