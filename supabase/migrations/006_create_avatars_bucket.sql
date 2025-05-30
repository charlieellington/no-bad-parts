-- Creates a public-read Storage bucket for profile photos
-- Created via Cursor Task-11A 2025-06-02

-- Bucket creation (noop if already exists)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'avatars') THEN
    PERFORM storage.create_bucket('avatars', public := true);
  END IF;
END $$;

-- Ensure bucket is set to public (idempotent)
UPDATE storage.buckets SET public = true WHERE name = 'avatars'; 