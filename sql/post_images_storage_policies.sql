-- Run in the Supabase SQL Editor.
--
-- WHAT THIS ADDS
-- ----------------
-- Marking the "post-images" Storage bucket "Public" in the dashboard only
-- allows public *downloads* (the /object/public/... URL route bypasses
-- RLS). Uploading/deleting always goes through the authenticated route,
-- which still enforces RLS on storage.objects — without a policy here,
-- every upload from admin/posts.js (cover images, inline Quill images)
-- fails with "new row violates row-level security policy".
--
-- Same shape as the RLS used everywhere else in this repo: anon can only
-- read, authenticated (admin panel) has full access — scoped to just this
-- bucket via bucket_id, so it can't affect other buckets.

drop policy if exists "public read post-images" on storage.objects;
create policy "public read post-images"
	on storage.objects
	for select
	to public
	using (bucket_id = 'post-images');

drop policy if exists "authenticated manage post-images" on storage.objects;
create policy "authenticated manage post-images"
	on storage.objects
	for all
	to authenticated
	using (bucket_id = 'post-images')
	with check (bucket_id = 'post-images');
