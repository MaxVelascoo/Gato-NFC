-- Extends the existing care_tasks / care_events model without replacing rows.

create extension if not exists pgcrypto;

create table if not exists public.cats (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  weight_kg numeric(5,2) check (weight_kg is null or weight_kg > 0),
  birthday date,
  next_vaccine_on date,
  avatar_emoji text not null default '🐈',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.care_tasks
  add column if not exists kind text not null default 'other';

update public.care_tasks
set kind = case code
  when 'agua' then 'water'
  when 'comida' then 'food'
  when 'arenero' then 'litter'
  else kind
end;

alter table public.care_tasks drop constraint if exists care_tasks_kind_check;
alter table public.care_tasks add constraint care_tasks_kind_check
  check (kind in ('water', 'food', 'litter', 'other'));

alter table public.care_events
  add column if not exists cat_id uuid references public.cats(id) on delete set null,
  add column if not exists amount_grams integer check (amount_grams is null or amount_grams > 0),
  add column if not exists note text;

create index if not exists care_tasks_next_due_idx on public.care_tasks (next_due_at);
create index if not exists care_events_occurred_at_idx on public.care_events (occurred_at desc);
create index if not exists care_events_cat_id_idx on public.care_events (cat_id);

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  quantity numeric(8,2) not null default 0 check (quantity >= 0),
  unit text not null default 'unidades',
  low_stock_at numeric(8,2) not null default 1 check (low_stock_at >= 0),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.cats enable row level security;
alter table public.inventory_items enable row level security;
alter table public.care_tasks enable row level security;
alter table public.care_events enable row level security;

create or replace function public.complete_care_task_with_details(
  p_code text,
  p_actor text,
  p_cat_id uuid default null,
  p_amount_grams integer default null,
  p_note text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  task_row public.care_tasks%rowtype;
  completed_at timestamptz := now();
begin
  update public.care_tasks
  set last_completed_at = completed_at,
      last_completed_by = p_actor,
      next_due_at = completed_at + make_interval(hours => interval_hours),
      notified_at = null
  where code = p_code
  returning * into task_row;

  if not found then
    raise exception 'Tarea no encontrada: %', p_code using errcode = 'P0002';
  end if;

  insert into public.care_events (task_id, actor, occurred_at, cat_id, amount_grams, note)
  values (task_row.id, coalesce(nullif(trim(p_actor), ''), 'Hogar'), completed_at, p_cat_id, p_amount_grams, p_note);

  return jsonb_build_object(
    'success', true,
    'task_id', task_row.id,
    'code', task_row.code,
    'name', task_row.name,
    'last_completed_at', task_row.last_completed_at,
    'next_due_at', task_row.next_due_at
  );
end;
$$;

revoke all on function public.complete_care_task_with_details(text, text, uuid, integer, text) from public, anon, authenticated;
grant execute on function public.complete_care_task_with_details(text, text, uuid, integer, text) to service_role;
