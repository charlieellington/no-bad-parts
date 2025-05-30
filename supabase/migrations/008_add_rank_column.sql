-- 008_add_rank_column.sql
-- Adds an optional `rank` column to allow bumping users up the wait-list.
-- Created via Cursor Task-11E 2025-06-02

-- 1. Add the column (nullable int so existing rows default to NULL)
ALTER TABLE public.waitlist_signups
  ADD COLUMN IF NOT EXISTS rank INTEGER;

-- 2. Helpful composite index for ordering (NULLS LAST on rank)
--    Postgres treats NULL as highest when ordering ASC with NULLS LAST.
CREATE INDEX IF NOT EXISTS waitlist_signups_rank_idx
  ON public.waitlist_signups (rank ASC NULLS LAST, created_at ASC);

-- 3. Update public view to expose rank (optional – keeps column list stable)
CREATE OR REPLACE VIEW public.waitlist_public AS
SELECT
  id,
  name,
  hidden,
  note,
  avatar_url,
  rank,
  created_at
FROM public.waitlist_signups; 