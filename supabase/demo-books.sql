-- =====================================================================================
-- BOOKNEST DEMO DATA  (fictional authors + books, for showing the site before real users)
--
-- ADD:     run this whole file in Supabase -> SQL Editor. Safe to run again (it resets the demo rows first).
-- REMOVE:  run supabase/demo-books-remove.sql. It deletes ONLY rows whose author id starts with 'demo-'.
--          Real users, their books, likes and follows are never touched.
--
-- Everything here is made up: names, books and blurbs are fictional, and buy links point to example.com.
-- Covers are served from /demo-covers/*.jpg (the files in public/demo-covers).
-- =====================================================================================

-- 0. Start clean so re-running never duplicates anything.
delete from public.authors where id like 'demo-%';

-- 1. Fictional authors ---------------------------------------------------------------
insert into public.authors (id, name, genres, bio, followers_count) values
  ('demo-elias-marwen',       'Elias Marwen',       'Fantasy · Adventure',   'Writes sweeping fantasy about crowns, oceans and the people who get left out of the legends.', 1840),
  ('demo-sora-winters',       'Sora Winters',       'Romance · Historical',  'Quiet love stories set by lakes, in letters and in the first days of spring.',                 2310),
  ('demo-idris-calloway',     'Idris Calloway',     'Mystery · Thriller',    'Old houses, small clues and slow-burning suspense. Tea strongly recommended.',                  960),
  ('demo-lena-castellane',    'Lena Castellane',    'Sci-Fi · Adventure',    'Space operas and long roads. Believes every journey is mostly about who you travel with.',      1275),
  ('demo-marguerite-thorne',  'Marguerite Thorne',  'Historical · Mystery',  'Harbour towns, hidden archives and promises that outlive the people who made them.',            720),
  ('demo-jonah-pell',         'Jonah Pell',         'Self-Help · Young Adult', 'Practical, gentle books on calm, focus and finding your own quiet place to grow.',             3050);

-- 2. Fictional books -----------------------------------------------------------------
insert into public.books
  (slug, title, author_id, cover_url, description, formats, status, release_date, discount_percent, discount_ends_on, discount_code, likes_count, saves_count)
values
  ('demo-the-winding-road', 'The Winding Road', 'demo-lena-castellane', '/demo-covers/the-winding-road.jpg',
   'When a failing farm and a map nobody can read land in her lap, Wren sets off on a road that seems to move every time she looks away. Across golden valleys and strange little towns she learns that the way home is rarely the way you planned.',
   '{eBook,Paperback}', 'published', current_date - 3, null, null, null, 214, 96),

  ('demo-a-shadow-in-the-manor', 'A Shadow in the Manor', 'demo-idris-calloway', '/demo-covers/a-shadow-in-the-manor.jpg',
   'Every window of Harrowmere Manor glows at midnight, though no one has lived there for thirty years. Investigator Nell Ashby has one night to learn who is lighting the lamps, and why the house seems to know her name.',
   '{eBook,Paperback}', 'published', current_date - 12, null, null, null, 388, 171),

  ('demo-the-river-between-us', 'The River Between Us', 'demo-sora-winters', '/demo-covers/the-river-between-us.jpg',
   'Two people, one old wooden dock and a summer neither planned. As the river rises and the evenings grow longer, Mara and Eli must decide whether some things are worth the risk of staying.',
   '{eBook,Paperback}', 'published', current_date - 6, null, null, null, 502, 240),

  ('demo-on-distant-worlds', 'On Distant Worlds', 'demo-lena-castellane', '/demo-covers/on-distant-worlds.jpg',
   'The survey ship Kestrel was meant to chart one quiet system. Instead its crew finds a signal from a planet that should be empty, and a choice that will decide how humanity meets the stars.',
   '{eBook,Paperback}', 'published', current_date - 25, null, null, null, 447, 205),

  ('demo-the-forgotten-library', 'The Forgotten Library', 'demo-marguerite-thorne', '/demo-covers/the-forgotten-library.jpg',
   'Beneath a closed university lies a library that appears on no plan. Archivist Tomas Reed starts cataloguing its shelves and discovers the books are quietly rewriting themselves.',
   '{eBook,Paperback}', 'published', current_date - 40, null, null, null, 331, 189),

  ('demo-letters-from-spring', 'Letters from Spring', 'demo-sora-winters', '/demo-covers/letters-from-spring.jpg',
   'A wax-sealed envelope arrives sixty years late. Inside are letters between two strangers who never met, and a granddaughter who sets out to find out how their story ended.',
   '{eBook,Paperback}', 'published', current_date - 18, null, null, null, 276, 144),

  ('demo-the-iron-crown', 'The Iron Crown', 'demo-elias-marwen', '/demo-covers/the-iron-crown.jpg',
   'Three heirs, one crown and a kingdom that will not survive a civil war. Princess Isolde has a secret that could end the fight, if she can live long enough to tell it.',
   '{eBook,Paperback}', 'published', current_date - 1, null, null, null, 612, 298),

  ('demo-beneath-the-sea', 'Beneath the Sea', 'demo-elias-marwen', '/demo-covers/beneath-the-sea.jpg',
   'A drowned city, a diver who can hear its bells, and a tide that is slowly bringing something back to the surface. Coming soon.',
   '{eBook,Paperback}', 'published', current_date + 21, null, null, null, 158, 87),

  ('demo-the-quiet-mind', 'The Quiet Mind', 'demo-jonah-pell', '/demo-covers/the-quiet-mind.jpg',
   'A short, practical guide to slowing down. Simple daily habits for calmer mornings, clearer focus and a little more room to breathe. No gurus, no jargon.',
   '{eBook,Paperback}', 'published', current_date - 55, null, null, null, 421, 233),

  ('demo-the-merchants-promise', 'The Merchant''s Promise', 'demo-marguerite-thorne', '/demo-covers/the-merchants-promise.jpg',
   'In a busy harbour town, young trader Ines Calder inherits a ship and a promise made decades ago. To keep it she must outwit rivals, sail through storms and decide what honesty is worth.',
   '{eBook,Paperback}', 'published', current_date - 70, 15, null, 'SAIL15', 189, 102),

  ('demo-a-study-of-truth', 'A Study of Truth', 'demo-idris-calloway', '/demo-covers/a-study-of-truth.jpg',
   'A magnifying glass, a half-finished map and a client who is lying about something small. Detective Oriel Finch follows the thread, only to find it ties back to her own past.',
   '{eBook,Paperback}', 'published', current_date - 90, null, null, null, 267, 131),

  ('demo-the-hidden-garden', 'The Hidden Garden', 'demo-jonah-pell', '/demo-covers/the-hidden-garden.jpg',
   'Behind a wall of roses lives a garden that no one remembers planting. Fifteen-year-old Pip finds the gate, and with it a summer of secrets, friendship and the courage to start fresh.',
   '{eBook,Paperback}', 'published', current_date - 5, 25, current_date + 10, 'GARDEN25', 358, 176);

-- 3. Genres (position 0 = main genre) ------------------------------------------------
insert into public.book_genres (book_id, genre_slug, position)
select b.id, g.genre, g.pos
from (values
  ('demo-the-winding-road',        'adventure',   0),
  ('demo-a-shadow-in-the-manor',   'thriller',    0), ('demo-a-shadow-in-the-manor',   'horror',      1),
  ('demo-the-river-between-us',    'romance',     0),
  ('demo-on-distant-worlds',       'sci-fi',      0), ('demo-on-distant-worlds',       'adventure',   1),
  ('demo-the-forgotten-library',   'mystery',     0), ('demo-the-forgotten-library',   'fantasy',     1),
  ('demo-letters-from-spring',     'romance',     0), ('demo-letters-from-spring',     'historical',  1),
  ('demo-the-iron-crown',          'fantasy',     0),
  ('demo-beneath-the-sea',         'fantasy',     0), ('demo-beneath-the-sea',         'adventure',   1),
  ('demo-the-quiet-mind',          'self-help',   0),
  ('demo-the-merchants-promise',   'historical',  0), ('demo-the-merchants-promise',   'adventure',   1),
  ('demo-a-study-of-truth',        'mystery',     0),
  ('demo-the-hidden-garden',       'young-adult', 0), ('demo-the-hidden-garden',       'fantasy',     1)
) as g(book_slug, genre, pos)
join public.books b on b.slug = g.book_slug;

-- 4. Buy links (placeholder example.com pages, never real stores) --------------------
insert into public.book_links (book_id, type, format, url)
select b.id, l.type::public.link_type, l.format::public.link_format, 'https://example.com/demo/' || b.slug || '/' || l.format
from public.books b
cross join (values ('amazon', 'printed'), ('other', 'ebook')) as l(type, format)
where b.slug like 'demo-%';

-- 5. Quick check: should show 6 authors, 12 books ------------------------------------
select (select count(*) from public.authors where id like 'demo-%') as demo_authors,
       (select count(*) from public.books   where slug like 'demo-%') as demo_books;
