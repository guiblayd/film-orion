create or replace function public.normalize_username(input text)
returns text
language sql
immutable
set search_path = public
as $$
  select trim(both '_' from regexp_replace(
    regexp_replace(
      lower(
        translate(
          coalesce(input, ''),
          'áàâãäåéèêëíìîïóòôõöúùûüçñýÿÁÀÂÃÄÅÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑÝ',
          'aaaaaaeeeeiiiiooooouuuucnyyAAAAAAEEEEIIIIOOOOOUUUUCNY'
        )
      ),
      '[^a-z0-9_]+',
      '_',
      'g'
    ),
    '_+',
    '_',
    'g'
  ));
$$;

create or replace function public.generate_unique_username(seed text, profile_id uuid default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  reserved_usernames text[] := array[
    'admin', 'api', 'app', 'auth', 'create', 'explore', 'feed', 'help', 'home',
    'item', 'items', 'login', 'me', 'notifications', 'perfil', 'profile',
    'recommendation', 'recommendations', 'reset', 'root', 'search', 'settings',
    'signup', 'support', 'system', 'user', 'users'
  ];
  base_username text;
  candidate text;
  suffix integer := 0;
  suffix_text text;
begin
  base_username := public.normalize_username(seed);

  if base_username = '' then
    base_username := 'user_' || substring(md5(coalesce(profile_id::text, gen_random_uuid()::text)) from 1 for 8);
  end if;

  if char_length(base_username) < 3 then
    base_username := left(base_username || '_' || substring(md5(coalesce(profile_id::text, gen_random_uuid()::text)) from 1 for 8), 24);
  else
    base_username := left(base_username, 24);
  end if;

  if base_username = any(reserved_usernames) then
    base_username := left(base_username || '_' || substring(md5(coalesce(profile_id::text, gen_random_uuid()::text)) from 1 for 4), 24);
  end if;

  candidate := base_username;

  while exists (
    select 1
    from public.profiles profile
    where lower(profile.username) = lower(candidate)
      and (profile_id is null or profile.id <> profile_id)
  ) loop
    suffix := suffix + 1;
    suffix_text := '_' || suffix::text;
    candidate := left(base_username, greatest(3, 24 - char_length(suffix_text))) || suffix_text;
  end loop;

  return candidate;
end;
$$;

alter table public.profiles
  add column if not exists username text;

update public.profiles profile
set username = public.generate_unique_username(
  coalesce(
    nullif(profile.name, ''),
    split_part(profile.id::text, '-', 1)
  ),
  profile.id
)
where profile.username is null
   or btrim(profile.username) = '';

do $$
begin
  if exists (
    select 1
    from public.profiles profile
    where profile.username is null
       or btrim(profile.username) = ''
  ) then
    raise exception 'All profiles must have a username before enforcing constraints.';
  end if;
end;
$$;

alter table public.profiles
  alter column username set not null;

create unique index if not exists profiles_username_lower_key
  on public.profiles (lower(username));

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_username_format_check'
  ) then
    alter table public.profiles
      add constraint profiles_username_format_check
      check (username ~ '^[a-z0-9_]{3,24}$');
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_username_reserved_check'
  ) then
    alter table public.profiles
      add constraint profiles_username_reserved_check
      check (
        not (
          username = any (
            array[
              'admin', 'api', 'app', 'auth', 'create', 'explore', 'feed', 'help', 'home',
              'item', 'items', 'login', 'me', 'notifications', 'perfil', 'profile',
              'recommendation', 'recommendations', 'reset', 'root', 'search', 'settings',
              'signup', 'support', 'system', 'user', 'users'
            ]
          )
        )
      );
  end if;
end;
$$;

create or replace function public.handle_new_user()
returns trigger as $$
declare
  seed text;
  generated_username text;
  attempt integer := 0;
begin
  seed := coalesce(
    nullif(new.raw_user_meta_data->>'preferred_username', ''),
    nullif(new.raw_user_meta_data->>'user_name', ''),
    nullif(new.raw_user_meta_data->>'name', ''),
    split_part(coalesce(new.email, new.id::text), '@', 1)
  );

  loop
    generated_username := case
      when attempt = 0 then public.generate_unique_username(seed, new.id)
      else public.generate_unique_username(seed || '_' || substring(new.id::text from 1 for 6 + attempt), new.id)
    end;

    begin
      insert into public.profiles (id, name, avatar, username)
      values (
        new.id,
        coalesce(new.raw_user_meta_data->>'name', split_part(coalesce(new.email, new.id::text), '@', 1)),
        coalesce(
          new.raw_user_meta_data->>'avatar_url',
          'https://api.dicebear.com/7.x/avataaars/svg?seed=' || new.id::text
        ),
        generated_username
      )
      on conflict (id) do nothing;

      exit;
    exception
      when unique_violation then
        attempt := attempt + 1;
        if attempt > 5 then
          raise;
        end if;
    end;
  end loop;

  return new;
end;
$$ language plpgsql security definer;
