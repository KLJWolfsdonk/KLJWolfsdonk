-- Run in the Supabase SQL Editor.
--
-- WHAT THIS ADDS
-- ----------------
-- Lets an admin manually reorder posts (up/down in admin/posts.html)
-- instead of always being locked to date order. Backfills sort_order from
-- the current post_date-descending order so nothing visually moves the
-- first time this runs — admin reordering only takes effect from here on.
-- Lower sort_order shows first, same convention as navigation_items.

alter table posts
	add column if not exists sort_order integer not null default 0;

update posts
set sort_order = ranked.rn * 10
from (
	select id, row_number() over (order by post_date desc, created_at desc) as rn
	from posts
) as ranked
where posts.id = ranked.id;

create index if not exists posts_published_sort_order_idx
	on posts (published, sort_order);
