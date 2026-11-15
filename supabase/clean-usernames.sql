-- Fablebook: clean usernames (and so clean website addresses).
-- Run once in Supabase > SQL Editor. Safe to run again.

-- 1. New accounts get "janedoe" instead of "janedoe1a2b3c".
create or replace function public.ensure_my_author(p_name text default null) returns public.authors
language plpgsql security definer set search_path = '' as $$
declare
  uid   text := public.requesting_user_id();
  nm    text := coalesce(nullif(trim(p_name), ''), 'Reader');
  slug  text := coalesce(nullif(trim(both '-' from left(public.slugify(nm), 13)), ''), 'reader') || '-' || substr(md5(public.requesting_user_id()), 1, 6);
  base  text := left(regexp_replace(lower(nm), '[^a-z0-9]', '', 'g'), 17);
  uname text;
  n     int := 1;
  me    public.authors;
begin
  if uid is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  select * into me from public.authors where user_id = uid;
  if found then
    return me;
  end if;
  -- A clean username (this is also the author's website address): "janedoe", then "janedoe2", "janedoe3"...
  if length(base) < 3 then base := 'reader'; end if;
  uname := base;
  while exists (select 1 from public.authors a where lower(a.username) = uname) loop
    n := n + 1;
    uname := left(base, 20 - length(n::text)) || n::text;
  end loop;
  insert into public.authors (id, user_id, name, username)
  values (slug, uid, left(nm, 80), uname)
  on conflict (user_id) do nothing;
  select * into me from public.authors where user_id = uid;
  return me;
end $$;

revoke all on function public.ensure_my_author(text) from public, anon;
grant execute on function public.ensure_my_author(text) to authenticated;

-- 2. Existing accounts: strip the old 6-character code from the end of auto-made usernames,
--    only when the shorter name is free, long enough and not already used by someone else.
with cand as (
  select a.id,
         left(a.username, length(a.username) - 6) as clean,
         row_number() over (partition by lower(left(a.username, length(a.username) - 6)) order by a.id) as rn
  from public.authors a
  where a.username is not null
    and a.user_id is not null
    and length(a.username) > 9
    and right(lower(a.username), 6) = substr(md5(a.user_id), 1, 6)
)
update public.authors a
set username = c.clean
from cand c
where a.id = c.id
  and c.rn = 1
  and c.clean ~ '^[A-Za-z0-9_]{3,20}$'
  and not exists (select 1 from public.authors o where lower(o.username) = lower(c.clean) and o.id <> a.id);

-- 3. Check the result:
-- select name, username from public.authors order by name;
