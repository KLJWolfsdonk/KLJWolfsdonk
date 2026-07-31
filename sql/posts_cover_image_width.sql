-- Run in the Supabase SQL Editor.
--
-- WHAT THIS ADDS
-- ----------------
-- Lets an admin control how wide a post's cover image displays (was always
-- forced to 100% of the container). Stored as a percentage of the
-- container width; 100 = the old full-width behavior, so existing posts
-- keep looking exactly the same after this migration.

alter table posts
	add column if not exists cover_image_width integer not null default 100;

do $$
begin
	if not exists (
		select 1 from pg_constraint where conname = 'posts_cover_image_width_range'
	) then
		alter table posts
			add constraint posts_cover_image_width_range
			check (cover_image_width between 10 and 100);
	end if;
end $$;
