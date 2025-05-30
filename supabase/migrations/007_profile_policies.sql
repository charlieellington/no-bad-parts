-- Grants authenticated users SELECT & UPDATE on their own waitlist_signup row
-- Created via Cursor Task-11D fix 2025-06-02

alter table public.waitlist_signups enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'waitlist_signups' and policyname = 'waitlist_signups_select_owner'
  ) then
    create policy waitlist_signups_select_owner on public.waitlist_signups
      for select to authenticated
      using (email = auth.jwt() ->> 'email');
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'waitlist_signups' and policyname = 'waitlist_signups_update_owner'
  ) then
    create policy waitlist_signups_update_owner on public.waitlist_signups
      for update to authenticated
      using (email = auth.jwt() ->> 'email')
      with check (email = auth.jwt() ->> 'email');
  end if;
end $$;

-- Ensure role grants exist
grant select, update on public.waitlist_signups to authenticated; 