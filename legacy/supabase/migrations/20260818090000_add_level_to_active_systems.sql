-- Separate the admin "level / progress" value from the lifecycle "status".
-- Previously the admin dialog's "Output/Level index" was stored into the
-- "status" column, which broke the public RLS policy (status = 'active').

ALTER TABLE "public"."active_systems" ADD COLUMN IF NOT EXISTS "level" TEXT;

-- Backfill: any row whose status is not a lifecycle value (active/stable/lab)
-- had a level value wrongly stored in status. Move it to "level" and set a
-- valid lifecycle status so the row becomes publicly visible.
UPDATE "public"."active_systems"
SET "status" = 'active',
    "level"  = "status"
WHERE "status" NOT IN ('active', 'stable', 'lab')
  AND ("level" IS NULL OR "level" = '');