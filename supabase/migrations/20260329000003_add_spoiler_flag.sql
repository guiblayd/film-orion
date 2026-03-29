alter table public.recommendations
  add column if not exists has_spoiler boolean not null default false;
