-- Security and integrity fixes found during the database audit:

-- 1. redistribution_records: the codebase (RedistributionRecordService.hide/
--    unhide, admin form) uses a "hidden" field, but the live table has no such
--    column, so hide/unhide errored. The public RLS policy (USING true) also
--    exposed internalNotes to anonymous users. Add the column, restrict public
--    reads to non-hidden rows, and hide internalNotes from anon.
--
--    Note: anon inherits access from the Supabase default table-level grants,
--    so a column-level REVOKE has no effect. Instead we drop anon's table
--    grants entirely and grant SELECT only on the columns the public UI reads.
ALTER TABLE "public"."redistribution_records" ADD COLUMN IF NOT EXISTS "hidden" BOOLEAN NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "Public read redistribution records" ON "public"."redistribution_records";
CREATE POLICY "Public read redistribution records" ON "public"."redistribution_records" FOR SELECT USING ("hidden" = false);

REVOKE ALL ON "public"."redistribution_records" FROM anon;
GRANT SELECT ("id","amount","destination","description","proofUrl","donatedAt","transactionReference","createdAt","updatedAt","hidden") ON "public"."redistribution_records" TO anon;

-- 2. books: the public read policy ignored the "hidden" flag, so hidden books
--    were still returned by the anonymous client.
DROP POLICY IF EXISTS "Public read books" ON "public"."books";
CREATE POLICY "Public read books" ON "public"."books" FOR SELECT USING ("hidden" = false);

-- 3. donations: successful donations are publicly readable, but donor email /
--    phone / name columns should not be exposed to anonymous users. The public
--    page only reads id, amount, publicName, createdAt, status. Same approach
--    as redistribution_records: drop anon's table grants and grant SELECT only
--    on the public columns.
REVOKE ALL ON "public"."donations" FROM anon;
GRANT SELECT ("id","amount","publicName","status","createdAt") ON "public"."donations" TO anon;

-- 4. subscriptions: the "Public can manage own subscription" policy granted
--    FOR ALL USING (true) — anonymous users could read, modify, or delete every
--    subscription. The app writes subscriptions exclusively through the
--    subscribeNewsletter server action, which now uses the admin client, so no
--    anonymous policy is needed at all.
DROP POLICY IF EXISTS "Public can manage own subscription" ON "public"."subscriptions";