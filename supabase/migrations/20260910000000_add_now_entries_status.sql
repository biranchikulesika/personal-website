-- Add status column to now_entries for draft/publish support.
-- All existing entries default to 'published' so the public /now page
-- continues to display them without interruption.

ALTER TABLE "public"."now_entries"
  ADD COLUMN IF NOT EXISTS "status" "public"."content_status" DEFAULT 'published' NOT NULL;

-- Ensure all existing rows have the published status explicitly set.
UPDATE "public"."now_entries" SET "status" = 'published' WHERE "status" IS NULL;
