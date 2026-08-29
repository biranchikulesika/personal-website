-- Rename assumed_audience → target_audience in posts table
-- This aligns the database column name with the application code (BlogPost.targetAudience).
-- Idempotent: skips if the column is already named target_audience.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'posts'
      AND column_name = 'assumed_audience'
  ) THEN
    ALTER TABLE public.posts
      RENAME COLUMN assumed_audience TO target_audience;
  END IF;
END $$;
