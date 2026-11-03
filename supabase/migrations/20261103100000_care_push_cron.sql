create schema if not exists extensions;
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

alter table public.care_tasks
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.push_task_notifications (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.care_tasks(id) on delete cascade,
  cycle_event_id uuid references public.care_events(id) on delete set null,
  cycle_started_at timestamptz not null,
  due_at timestamptz not null,
  task_name text not null,
  task_kind text not null,
  interval_hours integer not null,
  state text not null default 'pending' check (state in ('pending', 'sending', 'sent', 'failed')),
  attempts smallint not null default 0 check (attempts >= 0),
  claim_token uuid,
  claimed_at timestamptz,
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  unique (task_id, cycle_started_at)
);

create index if not exists push_task_notifications_pending_idx
  on public.push_task_notifications (due_at)
  where state in ('pending', 'sending');

alter table public.push_task_notifications enable row level security;
revoke all on public.push_task_notifications from public, anon, authenticated;

create or replace function public.enqueue_due_push_notifications()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_count integer;
begin
  insert into public.push_task_notifications (
    task_id,
    cycle_event_id,
    cycle_started_at,
    due_at,
    task_name,
    task_kind,
    interval_hours
  )
  select
    task.id,
    latest_event.id,
    coalesce(latest_event.occurred_at, task.last_completed_at, task.created_at) as cycle_started_at,
    coalesce(latest_event.occurred_at, task.last_completed_at, task.created_at)
      + make_interval(hours => task.interval_hours) as due_at,
    task.name,
    task.kind,
    task.interval_hours
  from public.care_tasks as task
  left join lateral (
    select event.id, event.occurred_at
    from public.care_events as event
    where event.task_id = task.id
    order by event.occurred_at desc, event.id desc
    limit 1
  ) as latest_event on true
  where task.interval_hours > 0
    and coalesce(latest_event.occurred_at, task.last_completed_at, task.created_at)
      + make_interval(hours => task.interval_hours) <= now()
  on conflict (task_id, cycle_started_at) do nothing;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

create or replace function public.claim_due_push_notifications(p_limit integer default 50)
returns table (
  id uuid,
  task_id uuid,
  task_name text,
  task_kind text,
  interval_hours integer,
  due_at timestamptz,
  claim_token uuid
)
language sql
security definer
set search_path = public
as $$
  with candidates as (
    select notification.id
    from public.push_task_notifications as notification
    where notification.attempts < 5
      and (
        notification.state = 'pending'
        or (notification.state = 'sending' and notification.claimed_at < now() - interval '2 minutes')
      )
    order by notification.due_at, notification.created_at
    for update skip locked
    limit greatest(1, least(coalesce(p_limit, 50), 100))
  ), claimed as (
    update public.push_task_notifications as notification
    set state = 'sending',
        attempts = notification.attempts + 1,
        claim_token = gen_random_uuid(),
        claimed_at = now(),
        last_error = null
    from candidates
    where notification.id = candidates.id
    returning notification.id, notification.task_id, notification.task_name,
      notification.task_kind, notification.interval_hours, notification.due_at,
      notification.claim_token
  )
  select * from claimed;
$$;

create or replace function public.finish_push_notification(
  p_id uuid,
  p_claim_token uuid,
  p_sent boolean,
  p_error text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
begin
  update public.push_task_notifications
  set state = case when p_sent then 'sent' when attempts >= 5 then 'failed' else 'pending' end,
      sent_at = case when p_sent then now() else null end,
      claim_token = null,
      claimed_at = null,
      last_error = case when p_sent then null else left(coalesce(p_error, 'No se pudo enviar la notificación'), 1000) end
  where id = p_id
    and state = 'sending'
    and claim_token = p_claim_token;

  get diagnostics updated_count = row_count;
  return updated_count = 1;
end;
$$;

revoke all on function public.enqueue_due_push_notifications() from public, anon, authenticated;
revoke all on function public.claim_due_push_notifications(integer) from public, anon, authenticated;
revoke all on function public.finish_push_notification(uuid, uuid, boolean, text) from public, anon, authenticated;
grant execute on function public.enqueue_due_push_notifications() to service_role;
grant execute on function public.claim_due_push_notifications(integer) to service_role;
grant execute on function public.finish_push_notification(uuid, uuid, boolean, text) to service_role;

do $$
declare
  existing_job record;
begin
  for existing_job in select jobid from cron.job where jobname = 'miau-care-task-push' loop
    perform cron.unschedule(existing_job.jobid);
  end loop;

  perform cron.schedule(
    'miau-care-task-push',
    '* * * * *',
    $job$
      with secrets as (
        select
          max(decrypted_secret) filter (where name = 'miau_care_app_url') as app_url,
          max(decrypted_secret) filter (where name = 'miau_care_push_token') as push_token
        from vault.decrypted_secrets
        where name in ('miau_care_app_url', 'miau_care_push_token')
      )
      select net.http_post(
        url := rtrim(secrets.app_url, '/') || '/api/push',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || secrets.push_token
        ),
        body := '{"action":"dispatch_due"}'::jsonb,
        timeout_milliseconds := 10000
      )
      from secrets
      where secrets.app_url like 'https://%'
        and secrets.push_token is not null
    $job$
  );
end;
$$;
