-- Run once in Supabase -> SQL Editor. Used by api/webhooks/clerk.ts (service_role only).
-- Creates the author row for a Clerk user id (same rules as ensure_my_author) or removes it on delete.
create or replace function public.create_author_for_user(p_user_id text, p_name text default null) returns public.authors
language plpgsql security definer set search_path = '' as $$
declare
  nm    text := coalesce(nullif(trim(p_name), ''), 'Reader');
  slug  text := coalesce(nullif(trim(both '-' from left(public.slugify(nm), 13)), ''), 'reader') || '-' || substr(md5(p_user_id), 1, 6);
  base  text := left(regexp_replace(lower(nm), '[^a-z0-9]', '', 'g'), 17);
  uname text;
  n     int := 1;
  me    public.authors;
begin
  if p_user_id is null or p_user_id = '' then raise exception 'missing user id'; end if;
  select * into me from public.authors where user_id = p_user_id;
  if found then return me; end if;
  if length(base) < 3 then base := 'reader'; end if;
  uname := base;
  while exists (select 1 from public.authors a where lower(a.username) = uname) loop
    n := n + 1;
    uname := left(base, 20 - length(n::text)) || n::text;
  end loop;
  insert into public.authors (id, user_id, name, username) values (slug, p_user_id, left(nm, 80), uname) on conflict (user_id) do nothing;
  select * into me from public.authors where user_id = p_user_id;
  return me;
end $$;
revoke all on function public.create_author_for_user(text, text) from public, anon, authenticated;
grant execute on function public.create_author_for_user(text, text) to service_role;

create or replace function public.delete_author_for_user(p_user_id text) returns void
language sql security definer set search_path = '' as $$ delete from public.authors where user_id = p_user_id $$;
revoke all on function public.delete_author_for_user(text) from public, anon, authenticated;
grant execute on function public.delete_author_for_user(text) to service_role;
