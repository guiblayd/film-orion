-- ============================================================
-- Indica — Supabase Schema
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================================

-- ── Profiles ────────────────────────────────────────────────
-- Extends auth.users. Criado automaticamente via trigger.

create table public.profiles (
  id     uuid references auth.users(id) on delete cascade primary key,
  name   text not null default '',
  avatar text,
  bio    text,
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Profiles visíveis para todos autenticados"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "Usuário pode inserir seu próprio perfil"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Usuário pode atualizar seu próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

-- Trigger: cria perfil automaticamente ao cadastrar (email ou Google)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, avatar)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=' || new.id::text
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ── Items ────────────────────────────────────────────────────
-- Filmes, séries e animes (principalmente do TMDB).

create table public.items (
  id    text primary key,  -- formato: tmdb_123
  title text not null,
  image text,
  type  text not null check (type in ('movie', 'series', 'anime')),
  year  int,
  created_at timestamptz default now() not null
);

alter table public.items enable row level security;

create policy "Items visíveis para todos autenticados"
  on public.items for select
  using (auth.role() = 'authenticated');

create policy "Usuários autenticados podem inserir items"
  on public.items for insert
  with check (auth.role() = 'authenticated');

create policy "Usuários autenticados podem atualizar items"
  on public.items for update
  using (auth.role() = 'authenticated');


-- ── Connections ──────────────────────────────────────────────

create table public.connections (
  id           uuid default gen_random_uuid() primary key,
  requester_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id  uuid references public.profiles(id) on delete cascade not null,
  status       text default 'accepted' check (status in ('pending', 'accepted', 'rejected')),
  created_at   timestamptz default now() not null,
  unique(requester_id, receiver_id)
);

alter table public.connections enable row level security;

create policy "Connections visíveis para todos autenticados"
  on public.connections for select
  using (auth.role() = 'authenticated');

create policy "Usuário gerencia suas próprias connections"
  on public.connections for all
  using (auth.uid() = requester_id);


-- ── Recommendations ──────────────────────────────────────────

create table public.recommendations (
  id                 uuid default gen_random_uuid() primary key,
  from_user_id       uuid references public.profiles(id) on delete cascade not null,
  to_user_id         uuid references public.profiles(id) on delete cascade not null,
  item_id            text references public.items(id) on delete cascade not null,
  message            text,
  discussion_enabled boolean default true not null,
  visibility         text default 'connections' check (visibility in ('public', 'connections', 'private')),
  created_at         timestamptz default now() not null
);

alter table public.recommendations enable row level security;

create policy "Recomendações visíveis para todos autenticados"
  on public.recommendations for select
  using (auth.role() = 'authenticated');

create policy "Usuário cria suas próprias recomendações"
  on public.recommendations for insert
  with check (auth.uid() = from_user_id);

create policy "Usuário edita suas próprias recomendações"
  on public.recommendations for update
  using (auth.uid() = from_user_id);

create policy "Usuário exclui suas próprias recomendações"
  on public.recommendations for delete
  using (auth.uid() = from_user_id);


-- ── Comments ─────────────────────────────────────────────────

create table public.comments (
  id                uuid default gen_random_uuid() primary key,
  recommendation_id uuid references public.recommendations(id) on delete cascade not null,
  user_id           uuid references public.profiles(id) on delete cascade not null,
  content           text not null,
  created_at        timestamptz default now() not null
);

alter table public.comments enable row level security;

create policy "Comentários visíveis para todos autenticados"
  on public.comments for select
  using (auth.role() = 'authenticated');

create policy "Usuário gerencia seus próprios comentários"
  on public.comments for all
  using (auth.uid() = user_id);


-- ── User Item Statuses ───────────────────────────────────────

create table public.user_item_statuses (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references public.profiles(id) on delete cascade not null,
  item_id    text references public.items(id) on delete cascade not null,
  status     text not null check (status in ('saved', 'watched', 'ignored')),
  created_at timestamptz default now() not null,
  unique(user_id, item_id)
);

alter table public.user_item_statuses enable row level security;

create policy "Usuário vê seus próprios status"
  on public.user_item_statuses for select
  using (auth.uid() = user_id);

create policy "Usuário gerencia seus próprios status"
  on public.user_item_statuses for all
  using (auth.uid() = user_id);


-- ── Recommendation Interactions ──────────────────────────────

create table public.recommendation_interactions (
  id                uuid default gen_random_uuid() primary key,
  recommendation_id uuid references public.recommendations(id) on delete cascade not null,
  user_id           uuid references public.profiles(id) on delete cascade not null,
  type              text not null check (type in ('support', 'oppose')),
  created_at        timestamptz default now() not null,
  unique(recommendation_id, user_id)
);

alter table public.recommendation_interactions enable row level security;

create policy "Interações visíveis para todos autenticados"
  on public.recommendation_interactions for select
  using (auth.role() = 'authenticated');

create policy "Usuário gerencia suas próprias interações"
  on public.recommendation_interactions for all
  using (auth.uid() = user_id);
