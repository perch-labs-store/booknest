-- =====================================================================================
-- REMOVE THE BOOKNEST DEMO DATA
-- Deletes only the demo authors (ids starting with 'demo-'). Their books, genres, buy links,
-- likes, saves and reviews are removed automatically with them. Real users are not touched.
-- Run once in Supabase -> SQL Editor.
-- After that, also delete the folder public/demo-covers from your project and redeploy.
-- =====================================================================================

delete from public.authors where id like 'demo-%';

-- Both numbers should be 0:
select (select count(*) from public.authors where id like 'demo-%') as demo_authors_left,
       (select count(*) from public.books   where slug like 'demo-%') as demo_books_left;
