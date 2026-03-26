create or replace function public.are_users_connected(user_a uuid, user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.connections connection
    where connection.status = 'accepted'
      and (
        (connection.requester_id = user_a and connection.receiver_id = user_b)
        or
        (connection.requester_id = user_b and connection.receiver_id = user_a)
      )
  );
$$;

grant execute on function public.are_users_connected(uuid, uuid) to authenticated;

create or replace function public.can_view_recommendation(rec public.recommendations)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
    and (
      auth.uid() = rec.from_user_id
      or auth.uid() = rec.to_user_id
      or rec.visibility = 'public'
      or (
        rec.visibility = 'connections'
        and (
          public.are_users_connected(auth.uid(), rec.from_user_id)
          or public.are_users_connected(auth.uid(), rec.to_user_id)
        )
      )
    );
$$;

grant execute on function public.can_view_recommendation(public.recommendations) to authenticated;

drop policy if exists "Recomendações visíveis para todos autenticados" on public.recommendations;

create policy "Usuário vê recomendações permitidas"
  on public.recommendations for select
  using (public.can_view_recommendation(recommendations));

drop policy if exists "Comentários visíveis para todos autenticados" on public.comments;
drop policy if exists "Usuário gerencia seus próprios comentários" on public.comments;

create policy "Usuário vê comentários de recomendações visíveis"
  on public.comments for select
  using (
    exists (
      select 1
      from public.recommendations recommendation
      where recommendation.id = comments.recommendation_id
        and public.can_view_recommendation(recommendation)
    )
  );

create policy "Usuário cria comentários em recomendações visíveis"
  on public.comments for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.recommendations recommendation
      where recommendation.id = comments.recommendation_id
        and recommendation.discussion_enabled
        and public.can_view_recommendation(recommendation)
    )
  );

create policy "Usuário atualiza seus próprios comentários"
  on public.comments for update
  using (auth.uid() = user_id);

create policy "Usuário exclui seus próprios comentários"
  on public.comments for delete
  using (auth.uid() = user_id);

drop policy if exists "Interações visíveis para todos autenticados" on public.recommendation_interactions;
drop policy if exists "Usuário gerencia suas próprias interações" on public.recommendation_interactions;

create policy "Usuário vê interações de recomendações visíveis"
  on public.recommendation_interactions for select
  using (
    exists (
      select 1
      from public.recommendations recommendation
      where recommendation.id = recommendation_interactions.recommendation_id
        and public.can_view_recommendation(recommendation)
    )
  );

create policy "Usuário cria interações em recomendações visíveis"
  on public.recommendation_interactions for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.recommendations recommendation
      where recommendation.id = recommendation_interactions.recommendation_id
        and public.can_view_recommendation(recommendation)
    )
  );

create policy "Usuário atualiza suas próprias interações"
  on public.recommendation_interactions for update
  using (auth.uid() = user_id);

create policy "Usuário exclui suas próprias interações"
  on public.recommendation_interactions for delete
  using (auth.uid() = user_id);

create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  recipient_id uuid references public.profiles(id) on delete cascade not null,
  actor_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (
    type in (
      'recommendation_received',
      'comment_added',
      'connection_created',
      'recommendation_status_changed'
    )
  ),
  recommendation_id uuid references public.recommendations(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  connection_id uuid references public.connections(id) on delete cascade,
  item_id text references public.items(id) on delete cascade,
  metadata jsonb default '{}'::jsonb not null,
  read_at timestamptz,
  created_at timestamptz default now() not null
);

create index if not exists notifications_recipient_created_at_idx
  on public.notifications (recipient_id, created_at desc);

create index if not exists notifications_unread_idx
  on public.notifications (recipient_id, read_at)
  where read_at is null;

alter table public.notifications enable row level security;

create policy "Usuário vê suas próprias notificações"
  on public.notifications for select
  using (auth.uid() = recipient_id);

create policy "Usuário marca suas próprias notificações"
  on public.notifications for update
  using (auth.uid() = recipient_id);

create or replace function public.create_notification(
  p_recipient_id uuid,
  p_actor_id uuid,
  p_type text,
  p_recommendation_id uuid default null,
  p_comment_id uuid default null,
  p_connection_id uuid default null,
  p_item_id text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_recipient_id is null or p_actor_id is null or p_recipient_id = p_actor_id then
    return;
  end if;

  insert into public.notifications (
    recipient_id,
    actor_id,
    type,
    recommendation_id,
    comment_id,
    connection_id,
    item_id,
    metadata
  )
  values (
    p_recipient_id,
    p_actor_id,
    p_type,
    p_recommendation_id,
    p_comment_id,
    p_connection_id,
    p_item_id,
    coalesce(p_metadata, '{}'::jsonb)
  );
end;
$$;

create or replace function public.notify_recommendation_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.create_notification(
    new.to_user_id,
    new.from_user_id,
    'recommendation_received',
    new.id,
    null,
    null,
    new.item_id,
    jsonb_build_object('visibility', new.visibility)
  );

  return new;
end;
$$;

create or replace function public.notify_comment_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recommendation_record public.recommendations%rowtype;
begin
  select *
  into recommendation_record
  from public.recommendations recommendation
  where recommendation.id = new.recommendation_id;

  if recommendation_record.id is null then
    return new;
  end if;

  perform public.create_notification(
    recommendation_record.from_user_id,
    new.user_id,
    'comment_added',
    recommendation_record.id,
    new.id,
    null,
    recommendation_record.item_id,
    jsonb_build_object('role', 'author')
  );

  perform public.create_notification(
    recommendation_record.to_user_id,
    new.user_id,
    'comment_added',
    recommendation_record.id,
    new.id,
    null,
    recommendation_record.item_id,
    jsonb_build_object('role', 'recipient')
  );

  return new;
end;
$$;

create or replace function public.notify_connection_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'accepted' then
    perform public.create_notification(
      new.receiver_id,
      new.requester_id,
      'connection_created',
      null,
      null,
      new.id,
      null,
      '{}'::jsonb
    );
  end if;

  return new;
end;
$$;

create or replace function public.notify_recommendation_status_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recommendation_record record;
begin
  if new.status not in ('saved', 'watched') then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status = new.status then
    return new;
  end if;

  for recommendation_record in
    select recommendation.id, recommendation.from_user_id, recommendation.item_id
    from public.recommendations recommendation
    where recommendation.to_user_id = new.user_id
      and recommendation.item_id = new.item_id
  loop
    perform public.create_notification(
      recommendation_record.from_user_id,
      new.user_id,
      'recommendation_status_changed',
      recommendation_record.id,
      null,
      null,
      recommendation_record.item_id,
      jsonb_build_object('status', new.status)
    );
  end loop;

  return new;
end;
$$;

drop trigger if exists on_recommendation_created_notify on public.recommendations;
create trigger on_recommendation_created_notify
  after insert on public.recommendations
  for each row execute procedure public.notify_recommendation_created();

drop trigger if exists on_comment_created_notify on public.comments;
create trigger on_comment_created_notify
  after insert on public.comments
  for each row execute procedure public.notify_comment_created();

drop trigger if exists on_connection_created_notify on public.connections;
create trigger on_connection_created_notify
  after insert on public.connections
  for each row execute procedure public.notify_connection_created();

drop trigger if exists on_user_item_status_changed_notify on public.user_item_statuses;
create trigger on_user_item_status_changed_notify
  after insert or update on public.user_item_statuses
  for each row execute procedure public.notify_recommendation_status_changed();
