-- Add last_edited_at to now_entries for record-keeping only.
-- The public "posted" date and ordering remain driven by created_at.
ALTER TABLE "public"."now_entries"
  ADD COLUMN IF NOT EXISTS "last_edited_at" timestamp with time zone;