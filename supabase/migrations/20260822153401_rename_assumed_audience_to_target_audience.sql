-- Rename assumed_audience → target_audience in posts table
-- This aligns the database column name with the application code (BlogPost.targetAudience).

ALTER TABLE public.posts
  RENAME COLUMN assumed_audience TO target_audience;
