-- Add optional note column for users to share why they are excited
alter table public.waitlist_signups
  add column if not exists note text; 