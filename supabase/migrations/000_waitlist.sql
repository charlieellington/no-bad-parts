create extension if not exists "uuid-ossp";

create table if not exists public.waitlist_signups (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  name text,
  referrer text,
  utm_source text,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.waitlist_signups enable row level security;

-- Policy: allow anyone to insert (e.g. a anon access from landing page)
create policy "waitlist_signups_insert_anon" on public.waitlist_signups
  for insert
  to public
  with check (true);

-- Policy: allow anyone to select rows (public read list)
create policy "waitlist_signups_select_anon" on public.waitlist_signups
  for select
  to public
  using (true); 