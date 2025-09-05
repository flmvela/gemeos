
-- Table: difficulty_level_labels
create table if not exists public.difficulty_level_labels (
  id uuid primary key default gen_random_uuid(),
  -- If null, the label applies globally; if set, it overrides for that domain
  domain_id text null,
  level_value integer not null check (level_value >= 0),
  label text not null,
  description text null,
  color text null,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure only one label per (domain_id, level_value),
-- with domain_id null treated as a single "GLOBAL" group for uniqueness
create unique index if not exists difficulty_level_labels_domain_level_key
  on public.difficulty_level_labels (coalesce(domain_id, 'GLOBAL'), level_value);

-- Helpful lookup performance
create index if not exists difficulty_level_labels_lookup_idx
  on public.difficulty_level_labels (domain_id, level_value);

-- Keep updated_at fresh
create trigger set_difficulty_level_labels_updated_at
before update on public.difficulty_level_labels
for each row execute function public.update_updated_at_column();

-- Enable Row Level Security
alter table public.difficulty_level_labels enable row level security;

-- RLS policies:
-- Anyone (authenticated) can read labels
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'difficulty_level_labels'
      and policyname = 'Anyone can view difficulty level labels'
  ) then
    create policy "Anyone can view difficulty level labels"
      on public.difficulty_level_labels
      for select
      using (true);
  end if;
end$$;

-- Only admins can insert labels
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'difficulty_level_labels'
      and policyname = 'Only admins can insert difficulty level labels'
  ) then
    create policy "Only admins can insert difficulty level labels"
      on public.difficulty_level_labels
      for insert
      with check (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text);
  end if;
end$$;

-- Only admins can update labels
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'difficulty_level_labels'
      and policyname = 'Only admins can update difficulty level labels'
  ) then
    create policy "Only admins can update difficulty level labels"
      on public.difficulty_level_labels
      for update
      using (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text)
      with check (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text);
  end if;
end$$;

-- Only admins can delete labels
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'difficulty_level_labels'
      and policyname = 'Only admins can delete difficulty level labels'
  ) then
    create policy "Only admins can delete difficulty level labels"
      on public.difficulty_level_labels
      for delete
      using (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text);
  end if;
end$$;

-- Optional: View that attaches label by preferring domain-specific label,
-- falling back to global label when no domain-specific exists.
create or replace view public.concepts_with_difficulty_label as
select
  c.*,
  l.label as difficulty_label
from public.concepts c
left join lateral (
  select label
  from public.difficulty_level_labels l
  where l.level_value = c.difficulty_level
    and (l.domain_id = c.domain_id or l.domain_id is null)
  order by (l.domain_id = c.domain_id) desc, l.display_order asc
  limit 1
) l on true;
