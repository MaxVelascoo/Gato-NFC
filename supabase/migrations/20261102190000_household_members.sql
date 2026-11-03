create table if not exists public.household_members (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(trim(name)) between 1 and 80),
  role text not null default 'miembro' check (length(trim(role)) between 1 and 40),
  created_at timestamptz not null default now()
);

alter table public.household_members enable row level security;

-- Existing care actors are real people already present in the household's activity log.
insert into public.household_members (name)
select distinct trim(actor)
from public.care_events
where actor is not null and length(trim(actor)) > 0
on conflict (name) do nothing;
