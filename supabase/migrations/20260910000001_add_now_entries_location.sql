-- Add location column to now_entries for sharing the posted place.
-- Existing entries default to empty (no location displayed).

ALTER TABLE "public"."now_entries"
  ADD COLUMN IF NOT EXISTS "location" "text" DEFAULT '' NOT NULL;