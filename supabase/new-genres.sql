-- =====================================================================================
-- MORE GENRES  (run once in Supabase -> SQL Editor; safe to run again)
-- Adds the new genre rows so authors can pick them when adding a book.
-- Slugs match what the site produces from the genre name, so don't rename them.
-- =====================================================================================
insert into public.genres (slug, name, icon, gradient, featured, sort_order) values
  ('bedtime-stories',           'Bedtime Stories',         'Moon',          'from-indigo-500 via-violet-800 to-slate-950', true,  8),
  ('childrens-books',           'Children''s Books',       'Baby',          'from-yellow-400 via-orange-500 to-pink-700',  true,  9),
  ('young-adult',               'Young Adult',             'Sparkles',      'from-fuchsia-500 via-purple-700 to-indigo-950', true, 10),
  ('adventure',                 'Adventure',               'Compass',       'from-emerald-500 via-teal-700 to-slate-950',  true, 11),
  ('horror',                    'Horror',                  'Ghost',         'from-red-700 via-zinc-800 to-black',          true, 12),
  ('historical',                'Historical',              'Scroll',        'from-amber-700 via-stone-700 to-stone-950',   true, 13),
  ('poetry',                    'Poetry',                  'Feather',       'from-rose-400 via-fuchsia-800 to-slate-950',  true, 14),
  ('biography-and-memoir',      'Biography & Memoir',      'User',          'from-slate-500 via-slate-700 to-zinc-950',    true, 15),
  ('comics-and-graphic-novels', 'Comics & Graphic Novels', 'Zap',           'from-cyan-500 via-blue-700 to-indigo-950',    true, 16),
  ('short-stories',             'Short Stories',           'BookOpen',      'from-lime-500 via-emerald-800 to-slate-950',  true, 17),
  ('faith-and-spirituality',    'Faith & Spirituality',    'Sun',           'from-sky-400 via-cyan-700 to-slate-950',      true, 18),
  ('education',                 'Education',               'GraduationCap', 'from-blue-500 via-sky-700 to-slate-950',      true, 19)
on conflict (slug) do update
  set icon = excluded.icon, gradient = excluded.gradient, featured = excluded.featured, sort_order = excluded.sort_order;

select count(*) as genres_total from public.genres;
