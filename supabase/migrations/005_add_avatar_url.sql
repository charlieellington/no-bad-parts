-- Adds avatar_url column and includes it in the public view
-- Created via Cursor Task-11A 2025-06-02

-- Add nullable text column for profile photos
ALTER TABLE public.waitlist_signups
    ADD COLUMN IF NOT EXISTS avatar_url text;

-- Expose new column in the public read-only view
CREATE OR REPLACE VIEW public.waitlist_public AS
SELECT
    id,
    name,
    hidden,
    note,
    avatar_url,
    created_at
FROM public.waitlist_signups;

-- Keep existing grants (Postgres will preserve privileges on replace) 