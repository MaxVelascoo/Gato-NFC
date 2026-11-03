alter table public.cats
  add column if not exists sex text check (sex is null or sex in ('male', 'female', 'unknown')),
  add column if not exists is_sterilized boolean,
  add column if not exists daily_meals_goal smallint check (daily_meals_goal is null or daily_meals_goal between 1 and 12),
  add column if not exists photo_url text,
  add column if not exists photo_path text;

create table if not exists public.cat_weight_logs (
  id uuid primary key default gen_random_uuid(),
  cat_id uuid not null references public.cats(id) on delete cascade,
  weight_kg numeric(5,2) not null check (weight_kg > 0),
  measured_at timestamptz not null default now(),
  note text,
  created_at timestamptz not null default now()
);

insert into public.cat_weight_logs (cat_id, weight_kg, measured_at, note)
select c.id, c.weight_kg, c.updated_at, 'Peso inicial del perfil'
from public.cats c
where c.weight_kg is not null
  and not exists (select 1 from public.cat_weight_logs w where w.cat_id = c.id);

create table if not exists public.care_reminders (
  id uuid primary key default gen_random_uuid(),
  cat_id uuid not null references public.cats(id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 120),
  category text not null default 'other' check (category in ('vaccine', 'deworming', 'weight', 'other')),
  due_on date not null,
  notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists care_reminders_cat_title_date_uidx
  on public.care_reminders (cat_id, title, due_on);

insert into public.care_reminders (cat_id, title, category, due_on)
select id, 'Vacuna', 'vaccine', next_vaccine_on
from public.cats
where next_vaccine_on is not null
on conflict (cat_id, title, due_on) do nothing;

create table if not exists public.cat_documents (
  id uuid primary key default gen_random_uuid(),
  cat_id uuid not null references public.cats(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 160),
  document_type text not null default 'veterinary' check (document_type in ('veterinary', 'vaccination', 'lab', 'other')),
  document_date date,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.cat_medical_records (
  id uuid primary key default gen_random_uuid(),
  cat_id uuid not null references public.cats(id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 120),
  record_type text not null default 'visit' check (record_type in ('visit', 'diagnosis', 'treatment', 'vaccination', 'other')),
  recorded_on date not null default current_date,
  clinic text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists cat_weight_logs_cat_date_idx on public.cat_weight_logs (cat_id, measured_at desc);
create index if not exists care_reminders_due_idx on public.care_reminders (due_on) where completed_at is null;
create index if not exists cat_documents_cat_created_idx on public.cat_documents (cat_id, created_at desc);
create index if not exists cat_medical_records_cat_date_idx on public.cat_medical_records (cat_id, recorded_on desc);

alter table public.cat_weight_logs enable row level security;
alter table public.care_reminders enable row level security;
alter table public.cat_documents enable row level security;
alter table public.cat_medical_records enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('cat-photos', 'cat-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('cat-documents', 'cat-documents', false, 15728640, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
