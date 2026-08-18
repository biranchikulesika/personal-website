-- The post repository calls postgREST .textSearch('fts', ...) but the live
-- database has no fts column, so search always errored (42P01) and was
-- swallowed into empty results. Add the generated tsvector column + GIN index
-- that the code already expects.

ALTER TABLE "public"."posts" ADD COLUMN IF NOT EXISTS "fts" tsvector
    GENERATED ALWAYS AS (
        to_tsvector(
            'english',
            coalesce("title", '') || ' ' ||
            coalesce("subtitle", '') || ' ' ||
            coalesce("excerpt", '') || ' ' ||
            coalesce("content", '')
        )
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_posts_fts ON "public"."posts" USING GIN ("fts");