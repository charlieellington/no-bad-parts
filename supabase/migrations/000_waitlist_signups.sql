create extension if not exists "uuid-ossp";

create table if not exists public.waitlist_signups (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  name text,
  hidden boolean not null default false,
  note text,
  referrer text,
  utm_source text,
  created_at timestamptz not null default now()
);

alter table public.waitlist_signups enable row level security;

-- allow anyone to insert
do $$
begin
  if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and policyname = 'waitlist_signups_insert_anon') then
    create policy "waitlist_signups_insert_anon" on public.waitlist_signups
      for insert to public with check (true);
  end if;
end $$;

-- allow anyone to select
do $$
begin
  if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and policyname = 'waitlist_signups_select_anon') then
    create policy "waitlist_signups_select_anon" on public.waitlist_signups
      for select to public using (true);
  end if;
end $$; 