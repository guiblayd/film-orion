create or replace function public.trigger_send_push_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url     := 'https://rtkyfoiwnnzvcohlnfvw.supabase.co/functions/v1/send-push'::text,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0a3lmb2l3bm56dmNvaGxuZnZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NjM1MjIsImV4cCI6MjA5MDAzOTUyMn0.8L5zHPZHr8YqpsesQjA3W587w-b5NH3Uq1T8i7il4-A'
    ),
    body    := row_to_json(NEW)::jsonb
  );
  return NEW;
exception when others then
  return NEW;
end;
$$;
