-- Add is_admin flag to profiles
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- Security-definer function to check admin (avoids RLS recursion)
create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

grant execute on function public.is_current_user_admin() to authenticated;

-- Recommendations: admin can view and delete all
create policy "Admin pode ver todas as recomendações"
  on public.recommendations for select
  using (public.is_current_user_admin());

create policy "Admin pode excluir qualquer recomendação"
  on public.recommendations for delete
  using (public.is_current_user_admin());

-- Comments: admin can view and delete all
create policy "Admin pode ver todos os comentários"
  on public.comments for select
  using (public.is_current_user_admin());

create policy "Admin pode excluir qualquer comentário"
  on public.comments for delete
  using (public.is_current_user_admin());

-- Connections: admin can view all
create policy "Admin pode ver todas as conexões"
  on public.connections for select
  using (public.is_current_user_admin());

-- Notifications: admin can view all and insert for any user
create policy "Admin pode ver todas as notificações"
  on public.notifications for select
  using (public.is_current_user_admin());

create policy "Admin pode inserir notificações"
  on public.notifications for insert
  with check (public.is_current_user_admin());

-- Update notifications type constraint to include admin_message
alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check check (
    type in (
      'recommendation_received',
      'comment_added',
      'connection_created',
      'recommendation_status_changed',
      'admin_message'
    )
  );
