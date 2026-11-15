-- =============================================================================
-- Fablebook — Supabase schema, security (RLS), storage and seed data
-- =============================================================================
-- HOW TO RUN: Supabase Dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to run more than once (everything is idempotent).
--
-- What's inside
--   1. Types           5. Triggers (counters, notifications) + ensure_my_author()
--   2. Tables          6. Row Level Security + column permissions
--   3. Indexes         7. Storage buckets (covers, avatars) + policies
--   4. Seed data       8. Realtime for notifications
--                         (genre list only; no sample books or authors)
--
-- AUTH: users are managed by Clerk, not Supabase Auth. Supabase verifies Clerk's
-- session token (Third-Party Auth), and the user's Clerk id (the token's `sub`,
-- e.g. "user_2abc…") is stored as TEXT in the *user_id columns below.
-- One-time setup:
--   Clerk dashboard    -> Supabase integration setup -> Activate (copy the Clerk domain)
--   Supabase dashboard -> Authentication -> Sign In / Up -> Third Party Auth -> Add Clerk
--
-- Model: each user has one `authors` row (public profile + author page), created
-- on first sign-in by calling  supabase.rpc('ensure_my_author', { p_name }).
-- =============================================================================


-- 1. TYPES ---------------------------------------------------------------------
do $$ begin create type public.book_format       as enum ('eBook', 'Paperback');                                  exception when duplicate_object then null; end $$;
do $$ begin create type public.book_status       as enum ('published', 'draft');                                  exception when duplicate_object then null; end $$;
do $$ begin create type public.link_type         as enum ('amazon', 'audiobook', 'other');                        exception when duplicate_object then null; end $$;
do $$ begin create type public.link_format       as enum ('printed', 'ebook', 'audiobook');                       exception when duplicate_object then null; end $$;
do $$ begin create type public.notification_type as enum ('like', 'follow', 'comment', 'update', 'milestone');    exception when duplicate_object then null; end $$;


-- 1b. CURRENT USER -------------------------------------------------------------
-- The signed-in user's Clerk id, read from the verified session token. NULL when signed out.
create or replace function public.requesting_user_id() returns text
language sql stable set search_path = '' as $$
  select nullif(auth.jwt() ->> 'sub', '')
$$;


-- 2. TABLES --------------------------------------------------------------------

-- Public author profiles. `id` is the URL slug (e.g. /authors/jane-doe-1a2b3c).
-- The *_count / rating / growth columns are display stats. followers_count
-- and books_count are kept up to date by triggers; the rest are display stats.
create table if not exists public.authors (
  id                  text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  user_id             text unique,                            -- Clerk user id
  name                text not null check (char_length(name) between 1 and 80),
  username            text check (username ~ '^[A-Za-z0-9_]{3,20}$'),
  genres              text,                                   -- display string, e.g. 'Fantasy · Adventure'
  bio                 text check (char_length(bio) <= 160),
  location            text,
  website             text,
  socials             jsonb not null default '{}'::jsonb,     -- { "instagram": "https://…", "x": "https://…" }
  avatar_url          text,
  verified            boolean not null default false,
  author_of_the_month boolean not null default false,
  followers_count     integer not null default 0 check (followers_count >= 0),
  books_count         integer not null default 0 check (books_count >= 0),
  rating_avg          numeric(3, 2) not null default 0,
  rating_count        integer not null default 0,
  growth_pct          numeric(5, 1) not null default 0,       -- follower growth this month, for "Trending"
  created_at          timestamptz not null default now()
);

create table if not exists public.genres (
  slug       text primary key,
  name       text not null unique,
  icon       text,                          -- lucide-react icon name, e.g. 'Castle'
  gradient   text,                          -- Tailwind gradient classes for the genre tile
  featured   boolean not null default false, -- shown on the Genres page
  sort_order integer not null default 100
);

create table if not exists public.books (
  id           bigint generated always as identity primary key,
  slug         text not null unique,
  title        text not null check (char_length(title) between 1 and 200),
  author_id    text not null references public.authors (id) on delete cascade,
  created_by   text default public.requesting_user_id(),  -- Clerk user id
  cover_url    text,
  description  text check (char_length(description) <= 2000),
  formats      public.book_format[] not null default '{}',
  status       public.book_status not null default 'published',
  release_date date,                         -- future date = "coming soon"
  discount_percent  smallint check (discount_percent between 1 and 99),  -- author's discount, shown as an "% off" badge
  discount_ends_on  date,                    -- last day of the offer; null = no end date
  discount_code     text check (discount_code ~ '^[A-Za-z0-9_-]{2,20}$'),
  likes_count  integer not null default 0 check (likes_count >= 0),
  saves_count  integer not null default 0 check (saves_count >= 0),
  rating_avg   numeric(3, 2) not null default 0,
  rating_count integer not null default 0 check (rating_count >= 0),
  created_at   timestamptz not null default now(),
  search       tsvector generated always as (to_tsvector('english', title || ' ' || coalesce(description, ''))) stored
);

-- First position = primary genre. The app shows at most 2–3 tags per book.
create table if not exists public.book_genres (
  book_id    bigint not null references public.books (id) on delete cascade,
  genre_slug text   not null references public.genres (slug) on delete restrict,
  position   smallint not null default 0,
  primary key (book_id, genre_slug)
);

-- Where a book can be bought elsewhere (Fablebook only lists books).
create table if not exists public.book_links (
  id      bigint generated always as identity primary key,
  book_id bigint not null references public.books (id) on delete cascade,
  type    public.link_type not null default 'other',   -- store: 'amazon' or 'other' ('audiobook' is no longer used)
  format  public.link_format not null default 'printed',  -- which version: printed copy, eBook or audiobook
  url     text not null check (url ~* '^https?://')
);

create table if not exists public.follows (
  follower_id text not null default public.requesting_user_id(),
  author_id   text not null references public.authors (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, author_id)
);

create table if not exists public.book_likes (
  user_id    text not null default public.requesting_user_id(),
  book_id    bigint not null references public.books (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, book_id)
);

create table if not exists public.book_saves (
  user_id    text not null default public.requesting_user_id(),
  book_id    bigint not null references public.books (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, book_id)
);

create table if not exists public.reviews (
  id         bigint generated always as identity primary key,
  book_id    bigint not null references public.books (id) on delete cascade,
  user_id    text not null default public.requesting_user_id(),
  rating     smallint not null check (rating between 1 and 5),
  body       text check (char_length(body) <= 2000),
  created_at timestamptz not null default now(),
  unique (book_id, user_id)
);

-- An author's public reply to a review on their own book (one reply per review).
create table if not exists public.review_replies (
  id         bigint generated always as identity primary key,
  review_id  bigint not null unique references public.reviews (id) on delete cascade,
  user_id    text not null default public.requesting_user_id(),
  body       text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

-- Rows are created by triggers below (follow / like) or by server-side code, never directly by clients.
create table if not exists public.notifications (
  id          bigint generated always as identity primary key,
  user_id     text not null,                               -- recipient (Clerk user id)
  type        public.notification_type not null,
  actor_name  text,
  title       text not null,
  detail      text,
  detail_kind text check (detail_kind in ('book', 'quote')),
  cover_url   text,
  book_id     bigint references public.books (id) on delete set null,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

-- The website each author builds from a template (one row per author and template).
create table if not exists public.site_docs (
  user_id     text not null default public.requesting_user_id(),
  template_id text not null,
  doc         jsonb not null,
  updated_at  timestamptz not null default now(),
  primary key (user_id, template_id)
);

-- Published websites: one live, public snapshot per author, served at <subdomain>.<your domain>.
-- This is a COPY of the author's site_docs row, taken when they press Publish. Autosave never touches it.
create table if not exists public.published_sites (
  subdomain    text primary key
               constraint published_sites_subdomain_format check (subdomain ~ '^[a-z0-9]([a-z0-9-]{1,30}[a-z0-9])$'),
  user_id      text not null default public.requesting_user_id(),
  template_id  text not null,
  doc          jsonb not null,
  author_name  text,
  title        text,
  published_at timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint published_sites_user_id_key unique (user_id)             -- one live site per author
);
-- Names nobody may claim (kept as a separate constraint so the list can be changed by re-running this file).
alter table public.published_sites drop constraint if exists published_sites_not_reserved;
alter table public.published_sites add  constraint published_sites_not_reserved
  check (subdomain <> all (array['www', 'app', 'api', 'admin', 'mail', 'ftp', 'blog', 'help', 'support', 'static', 'assets', 'cdn', 'dev', 'test', 'staging', 'status', 'docs', 'login', 'auth', 'dashboard', 'billing', 'ns1', 'ns2', 'smtp', 'imap', 'pop', 'fablebook']));

-- Genres page: genres with a live count of published books.
create or replace view public.genres_with_counts with (security_invoker = true) as
  select g.*, count(b.id)::int as books_count
  from public.genres g
  left join public.book_genres bg on bg.genre_slug = g.slug
  left join public.books b on b.id = bg.book_id and b.status = 'published'
  group by g.slug;


-- 2b. UPGRADES ------------------------------------------------------------------
-- For databases created from an earlier version of this file (no-ops on a fresh one).
alter table public.authors    drop column if exists reads_count;
alter table public.books      drop column if exists reads_count;
alter table public.books      add column if not exists discount_percent smallint check (discount_percent between 1 and 99);
alter table public.books      add column if not exists discount_ends_on date;
alter table public.books      add column if not exists discount_code    text check (discount_code ~ '^[A-Za-z0-9_-]{2,20}$');
alter table public.book_links add column if not exists format public.link_format not null default 'printed';
alter table public.authors    add column if not exists prefs jsonb not null default '{}'::jsonb;  -- settings toggles
alter table public.authors    add column if not exists banner_url text;
alter table public.authors    add column if not exists languages  text;   -- display string, e.g. 'English · Swahili'
alter table public.authors    add column if not exists featured_book_id bigint references public.books (id) on delete set null;
alter table public.authors    add column if not exists about      text check (char_length(about) <= 1500);
alter table public.authors    add column if not exists photo_url  text;   -- optional author photo (selfie / portrait) for "About the Author"; empty = coloured icon
alter table public.books      add column if not exists subtitle  text check (char_length(subtitle) <= 200);
alter table public.books      add column if not exists language  text;
alter table public.books      add column if not exists isbn      text check (isbn ~ '^([0-9]{9}[0-9Xx]|[0-9]{13})$');
alter table public.books      add column if not exists publisher text check (char_length(publisher) <= 120);

-- Two descriptions per book:
--   description       = the SHORT description (max 300 characters): hero slider, book cards, search results, top of the book page.
--   long_description  = the full story / what the book is about, shown on the book page.
--   about_author      = "About the author" text for this book (falls back to the author's profile text when empty).
alter table public.books      add column if not exists long_description text check (char_length(long_description) <= 8000);
alter table public.books      add column if not exists about_author     text check (char_length(about_author) <= 1500);

-- One-time tidy-up for books saved before the split: a description longer than 300 characters moves to
-- long_description and a short version (cut at a word, ending in "…") takes its place. Safe to run again: it only
-- touches rows that are still too long.
update public.books
   set long_description = coalesce(long_description, description),
       description      = regexp_replace(left(description, 297), '\s+\S*$', '') || '…'
 where char_length(description) > 300;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'books_description_short' and conrelid = 'public.books'::regclass) then
    alter table public.books add constraint books_description_short check (char_length(description) <= 300);
  end if;
end $$;


-- 3. INDEXES -------------------------------------------------------------------
create unique index if not exists authors_username_key       on public.authors (lower(username));
create unique index if not exists authors_one_of_the_month   on public.authors (author_of_the_month) where author_of_the_month;
-- Short news posts an author writes for their followers ("Book 2 launches Friday").
create table if not exists public.author_posts (
  id         bigint generated always as identity primary key,
  author_id  text not null references public.authors (id) on delete cascade,
  user_id    text not null default public.requesting_user_id(),
  body       text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists author_posts_author_idx on public.author_posts (author_id, created_at desc);

-- Requests for the verified badge. Review them in the Supabase Table Editor and set status to
-- 'approved' or 'rejected'. Approving turns on authors.verified and notifies the author automatically.
create table if not exists public.verification_requests (
  id          bigint generated always as identity primary key,
  author_id   text not null references public.authors (id) on delete cascade,
  user_id     text not null default public.requesting_user_id(),
  note        text check (char_length(note) <= 500),
  status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at  timestamptz not null default now(),
  reviewed_at timestamptz
);
create unique index if not exists verification_one_pending on public.verification_requests (user_id) where status = 'pending';

-- Private details that never appear on public pages (only the owner can read or write their row).
create table if not exists public.author_private (
  user_id    text primary key default public.requesting_user_id(),
  real_name  text check (char_length(real_name) <= 120),
  updated_at timestamptz not null default now()
);

create index if not exists books_author_idx                  on public.books (author_id);
create index if not exists books_status_release_idx          on public.books (status, release_date desc);
create index if not exists books_likes_idx                   on public.books (likes_count desc);
create index if not exists books_search_idx                  on public.books using gin (search);
create index if not exists book_genres_genre_idx             on public.book_genres (genre_slug);
create index if not exists follows_author_idx                on public.follows (author_id);
create index if not exists reviews_book_idx                  on public.reviews (book_id);
create index if not exists notifications_user_idx            on public.notifications (user_id, created_at desc);


-- 4. SEED DATA -----------------------------------------------------------------
-- Only the genre list (the categories authors pick from). No sample authors or
-- books: the catalog starts empty and fills up as authors add their books.

insert into public.genres (slug, name, icon, gradient, featured, sort_order) values
  ('fantasy', 'Fantasy', 'Castle', 'from-orange-500 via-rose-700 to-indigo-950', true, 0),
  ('romance', 'Romance', 'Heart', 'from-pink-500 via-rose-700 to-purple-950', true, 1),
  ('thriller', 'Thriller', 'Siren', 'from-sky-700 via-slate-800 to-slate-950', true, 2),
  ('sci-fi', 'Sci-Fi', 'Rocket', 'from-blue-600 via-indigo-800 to-slate-950', true, 3),
  ('self-help', 'Self-Help', 'Sprout', 'from-amber-500 via-orange-700 to-stone-900', true, 4),
  ('non-fiction', 'Non-Fiction', 'Landmark', 'from-emerald-600 via-teal-800 to-slate-950', true, 5),
  ('mystery', 'Mystery', 'Fingerprint', 'from-zinc-500 via-zinc-700 to-zinc-950', true, 6),
  ('business', 'Business', 'Briefcase', 'from-yellow-600 via-orange-800 to-slate-950', true, 7),
  ('adventure', 'Adventure', null, null, false, 100),
  ('young-adult', 'Young Adult', null, null, false, 100),
  ('horror', 'Horror', null, null, false, 100),
  ('historical', 'Historical', null, null, false, 100)
on conflict (slug) do nothing;


-- 5. TRIGGERS ------------------------------------------------------------------

create or replace function public.slugify(txt text) returns text
language sql immutable set search_path = '' as $$
  select trim(both '-' from regexp_replace(lower(coalesce(txt, '')), '[^a-z0-9]+', '-', 'g'))
$$;

-- Clerk does not write to this database, so the app asks for the user's author
-- profile right after sign-in. Creates it on first call, then just returns it.
--   const { data } = await supabase.rpc('ensure_my_author', { p_name: user.fullName })
create or replace function public.ensure_my_author(p_name text default null) returns public.authors
language plpgsql security definer set search_path = '' as $$
declare
  uid  text := public.requesting_user_id();
  nm   text := coalesce(nullif(trim(p_name), ''), 'Reader');
  base text := trim(both '-' from left(public.slugify(nm), 13));
  slug text;
  me   public.authors;
begin
  if uid is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  slug := coalesce(nullif(base, ''), 'reader') || '-' || substr(md5(uid), 1, 6);
  insert into public.authors (id, user_id, name, username)
  values (slug, uid, left(nm, 80), replace(slug, '-', ''))
  on conflict (user_id) do nothing;
  select * into me from public.authors where user_id = uid;
  return me;
end $$;

revoke all on function public.ensure_my_author(text) from public, anon;
grant execute on function public.ensure_my_author(text) to authenticated;

-- Featured book: an author can only feature one of their own published books.
create or replace function public.check_featured_book() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.featured_book_id is not null and not exists (
    select 1 from public.books b where b.id = new.featured_book_id and b.author_id = new.id and b.status = 'published'
  ) then
    raise exception 'You can only feature one of your own published books.' using errcode = '23514';
  end if;
  return new;
end $$;

drop trigger if exists authors_featured_check on public.authors;
create trigger authors_featured_check before insert or update of featured_book_id on public.authors
  for each row execute function public.check_featured_book();

-- New post: notify everyone who follows the author.
create or replace function public.on_post_created() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications (user_id, type, actor_name, title, detail, detail_kind)
  select f.follower_id, 'update', a.name, a.name || ' posted an update', left(new.body, 140), 'quote'
  from public.follows f join public.authors a on a.id = new.author_id
  where f.author_id = new.author_id and f.follower_id <> new.user_id;
  return null;
end $$;

drop trigger if exists posts_created on public.author_posts;
create trigger posts_created after insert on public.author_posts
  for each row execute function public.on_post_created();

-- Verification decided (in the dashboard): flag the author and tell them.
create or replace function public.on_verification_decided() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status = old.status then return new; end if;
  new.reviewed_at := now();
  if new.status = 'approved' then
    update public.authors set verified = true where id = new.author_id;
    insert into public.notifications (user_id, type, title) values (new.user_id, 'milestone', 'You are now a verified author');
  elsif new.status = 'rejected' then
    insert into public.notifications (user_id, type, title) values (new.user_id, 'milestone', 'Your verification request was not approved this time');
  end if;
  return new;
end $$;

drop trigger if exists verification_decided on public.verification_requests;
create trigger verification_decided before update of status on public.verification_requests
  for each row execute function public.on_verification_decided();

-- Follows: keep followers_count in sync and notify the author.
create or replace function public.on_follow_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    update public.authors set followers_count = followers_count + 1 where id = new.author_id;
    insert into public.notifications (user_id, type, actor_name, title)
    select a.user_id, 'follow', f.name, f.name || ' started following you.'
    from public.authors a join public.authors f on f.user_id = new.follower_id
    where a.id = new.author_id and a.user_id is not null;
  else
    update public.authors set followers_count = greatest(followers_count - 1, 0) where id = old.author_id;
  end if;
  return null;
end $$;

drop trigger if exists follows_change on public.follows;
create trigger follows_change after insert or delete on public.follows
  for each row execute function public.on_follow_change();

-- Likes: keep likes_count in sync and notify the book's author.
create or replace function public.on_like_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    update public.books set likes_count = likes_count + 1 where id = new.book_id;
    insert into public.notifications (user_id, type, actor_name, title, detail, detail_kind, cover_url, book_id)
    select a.user_id, 'like', f.name, f.name || ' liked your book', b.title || '.', 'book', b.cover_url, b.id
    from public.books b
    join public.authors a on a.id = b.author_id
    left join public.authors f on f.user_id = new.user_id
    where b.id = new.book_id and a.user_id is not null and a.user_id <> new.user_id;
  else
    update public.books set likes_count = greatest(likes_count - 1, 0) where id = old.book_id;
  end if;
  return null;
end $$;

drop trigger if exists likes_change on public.book_likes;
create trigger likes_change after insert or delete on public.book_likes
  for each row execute function public.on_like_change();

-- Saves: keep saves_count in sync.
create or replace function public.on_save_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    update public.books set saves_count = saves_count + 1 where id = new.book_id;
  else
    update public.books set saves_count = greatest(saves_count - 1, 0) where id = old.book_id;
  end if;
  return null;
end $$;

drop trigger if exists saves_change on public.book_saves;
create trigger saves_change after insert or delete on public.book_saves
  for each row execute function public.on_save_change();

-- Reviews: keep the running average and count up to date.
create or replace function public.on_review_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    update public.books
       set rating_avg = round((rating_avg * rating_count + new.rating) / (rating_count + 1), 2), rating_count = rating_count + 1
     where id = new.book_id;
  elsif tg_op = 'UPDATE' then
    update public.books
       set rating_avg = case when rating_count > 0 then round(rating_avg + (new.rating - old.rating)::numeric / rating_count, 2) else 0 end
     where id = new.book_id;
  else
    update public.books
       set rating_avg = case when rating_count > 1 then round((rating_avg * rating_count - old.rating) / (rating_count - 1), 2) else 0 end,
           rating_count = greatest(rating_count - 1, 0)
     where id = old.book_id;
  end if;
  return null;
end $$;

drop trigger if exists reviews_change on public.reviews;
create trigger reviews_change after insert or update of rating or delete on public.reviews
  for each row execute function public.on_review_change();

-- Books: keep the author's books_count (published only) in sync.
create or replace function public.on_book_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare aid text := coalesce(new.author_id, old.author_id);
begin
  update public.authors
     set books_count = (select count(*) from public.books where author_id = aid and status = 'published')
   where id = aid;
  return null;
end $$;

drop trigger if exists books_change on public.books;
create trigger books_change after insert or delete or update of status on public.books
  for each row execute function public.on_book_change();


-- Published sites: the address must be the owner's own username (lowercase, underscores -> hyphens,
-- hyphens trimmed from both ends), so nobody can claim a name that belongs to someone else.
-- Runs on every insert/update, whatever the client sends.
create or replace function public.guard_published_site() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  uname    text;
  expected text;
begin
  if tg_op = 'UPDATE' and new.user_id is distinct from old.user_id then
    raise exception 'A published site cannot be moved to another account.' using errcode = '42501';
  end if;

  select a.username into uname from public.authors a where a.user_id = new.user_id;
  if uname is null or uname = '' then
    raise exception 'username_required: Set a username in your profile before publishing.' using errcode = 'P0001';
  end if;

  expected := trim(both '-' from replace(lower(uname), '_', '-'));
  if new.subdomain is distinct from expected then
    raise exception 'subdomain_mismatch: The site address must match your username (%).', expected using errcode = 'P0001';
  end if;

  -- Another author whose username is exactly this name (e.g. "_jane" vs "jane") keeps priority.
  if exists (select 1 from public.authors a where lower(a.username) = new.subdomain and a.user_id is distinct from new.user_id) then
    raise exception 'subdomain_taken: That address belongs to another author.' using errcode = '23505';
  end if;
  return new;
end $$;

-- Timestamps are set by the database, never by the client.
create or replace function public.touch_published_site() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  if tg_op = 'INSERT' then
    new.published_at := now();
  else
    new.published_at := old.published_at;   -- first publish date stays; updated_at is the latest publish
  end if;
  return new;
end $$;

drop trigger if exists published_sites_guard on public.published_sites;
create trigger published_sites_guard before insert or update on public.published_sites
  for each row execute function public.guard_published_site();

drop trigger if exists published_sites_touch on public.published_sites;
create trigger published_sites_touch before insert or update on public.published_sites
  for each row execute function public.touch_published_site();


-- 6. ROW LEVEL SECURITY --------------------------------------------------------
alter table public.authors       enable row level security;
alter table public.genres        enable row level security;
alter table public.books         enable row level security;
alter table public.book_genres   enable row level security;
alter table public.book_links    enable row level security;
alter table public.follows       enable row level security;
alter table public.book_likes    enable row level security;
alter table public.book_saves    enable row level security;
alter table public.reviews       enable row level security;
alter table public.author_private enable row level security;
alter table public.author_posts   enable row level security;
alter table public.verification_requests enable row level security;
alter table public.review_replies enable row level security;
alter table public.notifications enable row level security;
alter table public.site_docs     enable row level security;
alter table public.published_sites enable row level security;

-- Column-level permissions: users can only edit the fields they should own.
-- Counters, `verified`, `author_of_the_month` etc. can only change via triggers or the dashboard.
revoke insert, update on public.authors       from anon, authenticated;
revoke insert, update on public.books         from anon, authenticated;
revoke update         on public.reviews       from anon, authenticated;
revoke insert, update on public.notifications from anon, authenticated;
grant update (name, username, genres, bio, location, website, socials, avatar_url, prefs) on public.authors to authenticated;
grant update (banner_url, about, featured_book_id, languages, photo_url) on public.authors to authenticated;
grant insert (slug, title, author_id, cover_url, description, formats, status, release_date, discount_percent, discount_ends_on, discount_code) on public.books to authenticated;
grant update (title, cover_url, description, formats, status, release_date, discount_percent, discount_ends_on, discount_code)                  on public.books to authenticated;
grant update (slug) on public.books to authenticated;
grant insert (subtitle, language, isbn, publisher) on public.books to authenticated;
grant update (subtitle, language, isbn, publisher) on public.books to authenticated;
grant insert (long_description, about_author) on public.books to authenticated;
grant update (long_description, about_author) on public.books to authenticated;
grant update (rating, body) on public.reviews to authenticated;
revoke update on public.review_replies from anon, authenticated;
grant update (body) on public.review_replies to authenticated;
grant update (read)         on public.notifications to authenticated;

-- Public catalog (readable by everyone, including signed-out visitors)
drop policy if exists "genres are public" on public.genres;
create policy "genres are public" on public.genres for select to anon, authenticated using (true);

drop policy if exists "authors are public" on public.authors;
create policy "authors are public" on public.authors for select to anon, authenticated using (true);

drop policy if exists "authors edit own profile" on public.authors;
create policy "authors edit own profile" on public.authors for update to authenticated
  using (user_id = public.requesting_user_id()) with check (user_id = public.requesting_user_id());

-- Books: everyone sees published books; owners also see their drafts.
drop policy if exists "books are public" on public.books;
create policy "books are public" on public.books for select to anon, authenticated
  using (status = 'published' or created_by = public.requesting_user_id());

drop policy if exists "authors add own books" on public.books;
create policy "authors add own books" on public.books for insert to authenticated
  with check (created_by = public.requesting_user_id()
              and exists (select 1 from public.authors a where a.id = author_id and a.user_id = public.requesting_user_id()));

drop policy if exists "authors edit own books" on public.books;
create policy "authors edit own books" on public.books for update to authenticated
  using (created_by = public.requesting_user_id()) with check (created_by = public.requesting_user_id());

drop policy if exists "authors delete own books" on public.books;
create policy "authors delete own books" on public.books for delete to authenticated
  using (created_by = public.requesting_user_id());

-- Genres and links follow the visibility of their book.
drop policy if exists "book genres visible" on public.book_genres;
create policy "book genres visible" on public.book_genres for select to anon, authenticated
  using (exists (select 1 from public.books b where b.id = book_id));
drop policy if exists "owners manage book genres" on public.book_genres;
create policy "owners manage book genres" on public.book_genres for all to authenticated
  using (exists (select 1 from public.books b where b.id = book_id and b.created_by = public.requesting_user_id()))
  with check (exists (select 1 from public.books b where b.id = book_id and b.created_by = public.requesting_user_id()));

drop policy if exists "book links visible" on public.book_links;
create policy "book links visible" on public.book_links for select to anon, authenticated
  using (exists (select 1 from public.books b where b.id = book_id));
drop policy if exists "owners manage book links" on public.book_links;
create policy "owners manage book links" on public.book_links for all to authenticated
  using (exists (select 1 from public.books b where b.id = book_id and b.created_by = public.requesting_user_id()))
  with check (exists (select 1 from public.books b where b.id = book_id and b.created_by = public.requesting_user_id()));

-- Follows / likes / saves: private to the user (public totals live in the *_count columns).
drop policy if exists "read own follows" on public.follows;
create policy "read own follows" on public.follows for select to authenticated using (follower_id = public.requesting_user_id());
drop policy if exists "follow as self" on public.follows;
create policy "follow as self" on public.follows for insert to authenticated
  with check (follower_id = public.requesting_user_id()
              and not exists (select 1 from public.authors a where a.id = author_id and a.user_id = public.requesting_user_id()));
drop policy if exists "unfollow as self" on public.follows;
create policy "unfollow as self" on public.follows for delete to authenticated using (follower_id = public.requesting_user_id());

drop policy if exists "read own likes" on public.book_likes;
create policy "read own likes" on public.book_likes for select to authenticated using (user_id = public.requesting_user_id());
drop policy if exists "like as self" on public.book_likes;
create policy "like as self" on public.book_likes for insert to authenticated
  with check (user_id = public.requesting_user_id() and exists (select 1 from public.books b where b.id = book_id));
drop policy if exists "unlike as self" on public.book_likes;
create policy "unlike as self" on public.book_likes for delete to authenticated using (user_id = public.requesting_user_id());

drop policy if exists "read own saves" on public.book_saves;
create policy "read own saves" on public.book_saves for select to authenticated using (user_id = public.requesting_user_id());
drop policy if exists "save as self" on public.book_saves;
create policy "save as self" on public.book_saves for insert to authenticated
  with check (user_id = public.requesting_user_id() and exists (select 1 from public.books b where b.id = book_id));
drop policy if exists "unsave as self" on public.book_saves;
create policy "unsave as self" on public.book_saves for delete to authenticated using (user_id = public.requesting_user_id());

-- Reviews: public to read, one per user per book.
drop policy if exists "reviews are public" on public.reviews;
create policy "reviews are public" on public.reviews for select to anon, authenticated using (true);
drop policy if exists "review as self" on public.reviews;
create policy "review as self" on public.reviews for insert to authenticated
  with check (user_id = public.requesting_user_id()
              -- authors cannot review their own books; they can only reply to readers' reviews
              and exists (select 1 from public.books b where b.id = book_id and b.created_by is distinct from public.requesting_user_id()));
drop policy if exists "edit own review" on public.reviews;
create policy "edit own review" on public.reviews for update to authenticated
  using (user_id = public.requesting_user_id()) with check (user_id = public.requesting_user_id());
drop policy if exists "delete own review" on public.reviews;
create policy "delete own review" on public.reviews for delete to authenticated using (user_id = public.requesting_user_id());

-- Review replies: public to read; only the book's own author can reply, edit or delete.
drop policy if exists "replies are public" on public.review_replies;
create policy "replies are public" on public.review_replies for select to anon, authenticated using (true);
drop policy if exists "author replies" on public.review_replies;
create policy "author replies" on public.review_replies for insert to authenticated
  with check (user_id = public.requesting_user_id()
              and exists (select 1 from public.reviews r join public.books b on b.id = r.book_id
                          where r.id = review_id and b.created_by = public.requesting_user_id()));
drop policy if exists "edit own reply" on public.review_replies;
create policy "edit own reply" on public.review_replies for update to authenticated
  using (user_id = public.requesting_user_id()) with check (user_id = public.requesting_user_id());
drop policy if exists "delete own reply" on public.review_replies;
create policy "delete own reply" on public.review_replies for delete to authenticated using (user_id = public.requesting_user_id());

-- Author posts: public to read; only the author can write or delete their own.
drop policy if exists "posts are public" on public.author_posts;
create policy "posts are public" on public.author_posts for select to anon, authenticated using (true);
drop policy if exists "post as author" on public.author_posts;
create policy "post as author" on public.author_posts for insert to authenticated
  with check (user_id = public.requesting_user_id()
              and exists (select 1 from public.authors a where a.id = author_id and a.user_id = public.requesting_user_id()));
drop policy if exists "delete own post" on public.author_posts;
create policy "delete own post" on public.author_posts for delete to authenticated using (user_id = public.requesting_user_id());
revoke update on public.author_posts from anon, authenticated;

-- Verification requests: authors see and file only their own (and need at least one published book).
revoke insert, update on public.verification_requests from anon, authenticated;
grant insert (author_id, note) on public.verification_requests to authenticated;
drop policy if exists "see own verification requests" on public.verification_requests;
create policy "see own verification requests" on public.verification_requests for select to authenticated
  using (user_id = public.requesting_user_id());
drop policy if exists "request verification" on public.verification_requests;
create policy "request verification" on public.verification_requests for insert to authenticated
  with check (user_id = public.requesting_user_id()
              and status = 'pending'
              and exists (select 1 from public.authors a where a.id = author_id and a.user_id = public.requesting_user_id() and not a.verified)
              and exists (select 1 from public.books b where b.author_id = public.verification_requests.author_id and b.status = 'published'));

-- Private author details (real name): owner only.
drop policy if exists "manage own private details" on public.author_private;
create policy "manage own private details" on public.author_private for all to authenticated
  using (user_id = public.requesting_user_id()) with check (user_id = public.requesting_user_id());

-- Template websites: private to their author.
drop policy if exists "manage own site docs" on public.site_docs;
create policy "manage own site docs" on public.site_docs for all to authenticated
  using (user_id = public.requesting_user_id()) with check (user_id = public.requesting_user_id());

-- Published sites: anyone can read; only the signed-in owner can publish, update or unpublish.
-- Timestamps are managed by triggers (see published_sites_touch).
revoke all on public.published_sites from anon, authenticated;
grant select                 on public.published_sites to anon, authenticated;
grant insert, update, delete on public.published_sites to authenticated;

drop policy if exists "published sites are public" on public.published_sites;
create policy "published sites are public" on public.published_sites for select to anon, authenticated using (true);

drop policy if exists "publish own site" on public.published_sites;
create policy "publish own site" on public.published_sites for insert to authenticated
  with check (user_id = public.requesting_user_id());

drop policy if exists "update own published site" on public.published_sites;
create policy "update own published site" on public.published_sites for update to authenticated
  using (user_id = public.requesting_user_id()) with check (user_id = public.requesting_user_id());

drop policy if exists "unpublish own site" on public.published_sites;
create policy "unpublish own site" on public.published_sites for delete to authenticated
  using (user_id = public.requesting_user_id());

-- Notifications: only the recipient can see, mark as read, or delete them.
drop policy if exists "read own notifications" on public.notifications;
create policy "read own notifications" on public.notifications for select to authenticated using (user_id = public.requesting_user_id());
drop policy if exists "update own notifications" on public.notifications;
create policy "update own notifications" on public.notifications for update to authenticated
  using (user_id = public.requesting_user_id()) with check (user_id = public.requesting_user_id());
drop policy if exists "delete own notifications" on public.notifications;
create policy "delete own notifications" on public.notifications for delete to authenticated using (user_id = public.requesting_user_id());


-- 7. STORAGE -------------------------------------------------------------------
-- Files must be uploaded to a folder named after the user's id: "<user-id>/<file>".
-- Buckets are public, so images load by URL; only owners can upload, replace or delete.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('covers',  'covers',  true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
  ('banners', 'banners', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "upload own images" on storage.objects;
create policy "upload own images" on storage.objects for insert to authenticated
  with check (bucket_id in ('covers', 'avatars', 'banners') and (storage.foldername(name))[1] = public.requesting_user_id());

drop policy if exists "replace own images" on storage.objects;
create policy "replace own images" on storage.objects for update to authenticated
  using (bucket_id in ('covers', 'avatars', 'banners') and (storage.foldername(name))[1] = public.requesting_user_id());

drop policy if exists "delete own images" on storage.objects;
create policy "delete own images" on storage.objects for delete to authenticated
  using (bucket_id in ('covers', 'avatars', 'banners') and (storage.foldername(name))[1] = public.requesting_user_id());


-- 8. REALTIME ------------------------------------------------------------------
-- Lets the app push new notifications live (supabase.channel(...).on('postgres_changes', ...)).
do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null;
end $$;

-- 9. PUSH NOTIFICATIONS ---------------------------------------------------------
-- One row per browser/device that agreed to live notifications. The send-push Edge Function
-- (supabase/functions/send-push) reads this table with the service role and sends a push each
-- time a row is added to `notifications`. Users never read or write it directly; they call
-- the two functions below, which also move a device to whoever signed in on it last.
create table if not exists public.push_subscriptions (
  endpoint   text primary key,
  user_id    text not null,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);
alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from anon, authenticated;

create or replace function public.save_push_subscription(p_endpoint text, p_p256dh text, p_auth text) returns void
language plpgsql security definer set search_path = '' as $$
declare uid text := public.requesting_user_id();
begin
  if uid is null then raise exception 'not signed in' using errcode = '28000'; end if;
  insert into public.push_subscriptions (endpoint, user_id, p256dh, auth)
  values (p_endpoint, uid, p_p256dh, p_auth)
  on conflict (endpoint) do update set user_id = uid, p256dh = excluded.p256dh, auth = excluded.auth;
end $$;

create or replace function public.remove_push_subscription(p_endpoint text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.push_subscriptions where endpoint = p_endpoint and user_id = public.requesting_user_id();
end $$;

revoke all on function public.save_push_subscription(text, text, text) from public, anon;
revoke all on function public.remove_push_subscription(text) from public, anon;
grant execute on function public.save_push_subscription(text, text, text) to authenticated;
grant execute on function public.remove_push_subscription(text) to authenticated;
