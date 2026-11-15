-- =============================================================================
-- Fablebook: publish a template website at <username>.<your domain>
-- Run once in the Supabase SQL Editor. Safe to run again (idempotent).
-- Needs supabase/schema.sql to have been run first (it uses public.authors and
-- public.requesting_user_id()). The same objects are also part of supabase/schema.sql.
-- =============================================================================

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

alter table public.published_sites enable row level security;

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
