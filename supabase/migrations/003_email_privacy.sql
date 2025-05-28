-- 003_email_privacy.sql
-- Purpose: prevent anonymous clients from selecting the `email` column.
-- Strategy: revoke SELECT on the base table from anon/public and expose a limited view.

-- 1. Revoke SELECT on the table for the public (anon) role
revoke select on table public.waitlist_signups from public;

-- 2. Ensure INSERT remains possible for public role
grant insert on table public.waitlist_signups to public;

-- 3. Drop existing anonymous SELECT policy if it exists (safety)
drop policy if exists "waitlist_signups_select_anon" on public.waitlist_signups;

-- 4. Create a safe view that omits the `email` column
create or replace view public.waitlist_public as
select
  id,
  name,
  hidden,
  note,
  created_at
from public.waitlist_signups;

-- 5. Grant SELECT on the view to the public (anon) role
grant select on public.waitlist_public to public; 