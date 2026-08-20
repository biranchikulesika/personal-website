-- =============================================================================
-- Production-ready domain schema.
-- =============================================================================
-- This migration creates tables aligned with the current domain types.
-- Designed for Supabase/PostgreSQL with proper constraints, indexes, and RLS.
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum for content status
DO $$ BEGIN
    CREATE TYPE "public"."content_status" AS ENUM ('published', 'unpublished');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ─── Slug Uniqueness Trigger ────────────────────────────────────────────────
-- Enforces cross-collection slug uniqueness at the database level.
-- A slug appearing in posts, notes, or books must be globally unique.
-- This function checks all three tables on INSERT/UPDATE.

CREATE OR REPLACE FUNCTION check_cross_collection_slug_uniqueness()
RETURNS TRIGGER AS $$
DECLARE
    existing_count INTEGER;
    target_table TEXT;
BEGIN
    -- Determine which table we're operating on
    IF TG_TABLE_NAME = 'posts' THEN
        target_table := 'posts';
    ELSIF TG_TABLE_NAME = 'notes' THEN
        target_table := 'notes';
    ELSIF TG_TABLE_NAME = 'books' THEN
        target_table := 'books';
    ELSE
        RETURN NEW;
    END IF;

    -- Count existing records with the same slug in OTHER collections
    SELECT COUNT(*) INTO existing_count
    FROM (
        SELECT slug FROM posts WHERE slug = NEW.slug AND TG_TABLE_NAME != 'posts'
        UNION ALL
        SELECT slug FROM notes WHERE slug = NEW.slug AND TG_TABLE_NAME != 'notes'
        UNION ALL
        SELECT slug FROM books WHERE slug = NEW.slug AND TG_TABLE_NAME != 'books'
    ) AS conflicts;

    IF existing_count > 0 THEN
        RAISE EXCEPTION 'Slug "%" already exists in another collection. Choose a unique slug.', NEW.slug;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── Posts ──────────────────────────────────────────────────────────────────
-- Blog posts with structured content (sections, intro, books as JSONB).
-- Uses UUID as stable primary key; slug is a unique URL identifier.

CREATE TABLE IF NOT EXISTS "public"."posts" (
    "id"               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "slug"             TEXT NOT NULL UNIQUE,
    "title"            TEXT NOT NULL,
    "subtitle"         TEXT,
    "description"      TEXT NOT NULL DEFAULT '',
    "persona"          TEXT,
    "tags"             TEXT[] DEFAULT '{}',
    "published_at"     DATE,
    "last_edited_at"   DATE,
    "assumed_audience" TEXT DEFAULT '',
    "intro"            JSONB DEFAULT '[]'::jsonb,
    "sections"         JSONB DEFAULT '[]'::jsonb,
    "books"            JSONB DEFAULT '[]'::jsonb,
    "cover_image"      TEXT,
    "status"           content_status NOT NULL DEFAULT 'published',
    "created_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_slug ON "public"."posts"("slug");
CREATE INDEX IF NOT EXISTS idx_posts_status ON "public"."posts"("status");
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON "public"."posts"("published_at" DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_posts_persona ON "public"."posts"("persona");

-- Cross-collection slug uniqueness trigger
CREATE TRIGGER trg_posts_slug_uniqueness
    BEFORE INSERT OR UPDATE OF slug ON "public"."posts"
    FOR EACH ROW EXECUTE FUNCTION check_cross_collection_slug_uniqueness();

-- ─── Notes ──────────────────────────────────────────────────────────────────
-- Short-form atomic notes with content paragraphs.

CREATE TABLE IF NOT EXISTS "public"."notes" (
    "id"             TEXT PRIMARY KEY,
    "slug"           TEXT NOT NULL UNIQUE,
    "title"          TEXT NOT NULL,
    "description"    TEXT NOT NULL DEFAULT '',
    "content"        JSONB DEFAULT '[]'::jsonb,
    "date"           DATE,
    "persona"        TEXT,
    "tags"           TEXT[] DEFAULT '{}',
    "cover_image"    TEXT,
    "status"         content_status NOT NULL DEFAULT 'published',
    "created_at"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_slug ON "public"."notes"("slug");
CREATE INDEX IF NOT EXISTS idx_notes_status ON "public"."notes"("status");
CREATE INDEX IF NOT EXISTS idx_notes_date ON "public"."notes"("date" DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_notes_persona ON "public"."notes"("persona");

CREATE TRIGGER trg_notes_slug_uniqueness
    BEFORE INSERT OR UPDATE OF slug ON "public"."notes"
    FOR EACH ROW EXECUTE FUNCTION check_cross_collection_slug_uniqueness();

-- ─── Books ──────────────────────────────────────────────────────────────────
-- Library books — always visible (no status field in current model).

CREATE TABLE IF NOT EXISTS "public"."books" (
    "id"             TEXT PRIMARY KEY,
    "slug"           TEXT NOT NULL UNIQUE,
    "title"          TEXT NOT NULL,
    "author"         TEXT NOT NULL,
    "description"    TEXT NOT NULL DEFAULT '',
    "date"           TEXT,       -- Year-only string (e.g., "2025"), not a DATE type
    "persona"        TEXT,
    "tags"           TEXT[] DEFAULT '{}',
    "cover"          TEXT,
    "link"           TEXT,
    "created_at"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_books_slug ON "public"."books"("slug");
CREATE INDEX IF NOT EXISTS idx_books_persona ON "public"."books"("persona");

CREATE TRIGGER trg_books_slug_uniqueness
    BEFORE INSERT OR UPDATE OF slug ON "public"."books"
    FOR EACH ROW EXECUTE FUNCTION check_cross_collection_slug_uniqueness();

-- ─── Now Entries ────────────────────────────────────────────────────────────
-- Timeline entries for the /now page. Content may contain custom <Book> tags.

CREATE TABLE IF NOT EXISTS "public"."now_entries" (
    "id"             TEXT PRIMARY KEY,
    "title"          TEXT NOT NULL,
    "date"           TEXT NOT NULL,   -- Month string (e.g., "2026-08"), not a DATE type
    "content"        TEXT NOT NULL DEFAULT '',
    "created_at"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_now_entries_date ON "public"."now_entries"("date" DESC);

-- ─── Media ──────────────────────────────────────────────────────────────────
-- Uploaded media files — referenced by posts, notes, books.

CREATE TABLE IF NOT EXISTS "public"."media" (
    "id"             TEXT PRIMARY KEY,
    "name"           TEXT NOT NULL,
    "src"            TEXT NOT NULL,
    "alt"            TEXT NOT NULL DEFAULT '',
    "size"           TEXT NOT NULL DEFAULT '',
    "dimensions"     TEXT,
    "uploaded_at"    DATE,
    "tag"            TEXT NOT NULL DEFAULT 'atmosphere',
    "created_at"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_tag ON "public"."media"("tag");

-- ─── Site Config (singleton) ────────────────────────────────────────────────
-- Single row storing the entire site configuration as JSONB.

CREATE TABLE IF NOT EXISTS "public"."site_config" (
    "id"             TEXT PRIMARY KEY DEFAULT 'singleton',
    "config"         JSONB NOT NULL DEFAULT '{}'::jsonb,
    "created_at"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Admin Profile (singleton) ──────────────────────────────────────────────
-- Admin profile — auth_status is protected at the service layer.

CREATE TABLE IF NOT EXISTS "public"."admin_profile" (
    "id"             TEXT PRIMARY KEY DEFAULT 'singleton',
    "name"           TEXT NOT NULL DEFAULT '',
    "email"          TEXT NOT NULL DEFAULT '',
    "avatar_url"     TEXT NOT NULL DEFAULT '',
    "role"           TEXT NOT NULL DEFAULT '',
    "auth_status"    TEXT NOT NULL DEFAULT 'developer_mode',
    "last_login"     TIMESTAMPTZ,
    "created_at"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Storage Files (orphan detection) ───────────────────────────────────────
-- Tracks files in the storage bucket for orphaned media detection.

CREATE TABLE IF NOT EXISTS "public"."storage_files" (
    "id"             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "path"           TEXT NOT NULL UNIQUE,
    "created_at"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Updated-at Triggers ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ DECLARE
    t text;
BEGIN
    FOR t IN
        SELECT unnest(ARRAY[
            'posts', 'notes', 'books', 'now_entries', 'media',
            'site_config', 'admin_profile'
        ])
    LOOP
        EXECUTE format(
            'CREATE TRIGGER set_updated_at BEFORE UPDATE ON "public".%I
             FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
            t
        );
    END LOOP;
END $$;

-- ─── Row Level Security ─────────────────────────────────────────────────────
ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."books" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."now_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."media" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."site_config" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."admin_profile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."storage_files" ENABLE ROW LEVEL SECURITY;

-- Public read: published content only
CREATE POLICY "Public read published posts"
    ON "public"."posts" FOR SELECT
    USING (status = 'published');

CREATE POLICY "Public read published notes"
    ON "public"."notes" FOR SELECT
    USING (status = 'published');

CREATE POLICY "Public read all books"
    ON "public"."books" FOR SELECT
    USING (true);

CREATE POLICY "Public read all now entries"
    ON "public"."now_entries" FOR SELECT
    USING (true);

CREATE POLICY "Public read all media"
    ON "public"."media" FOR SELECT
    USING (true);

CREATE POLICY "Public read site config"
    ON "public"."site_config" FOR SELECT
    USING (true);

CREATE POLICY "Public read admin profile"
    ON "public"."admin_profile" FOR SELECT
    USING (true);

-- Authenticated full access (admin operations use service-role client,
-- which bypasses RLS entirely. This policy is a safety net.)
DO $$ DECLARE
    t text;
BEGIN
    FOR t IN
        SELECT unnest(ARRAY[
            'posts', 'notes', 'books', 'now_entries', 'media',
            'site_config', 'admin_profile', 'storage_files'
        ])
    LOOP
        EXECUTE format(
            'CREATE POLICY "Authenticated full access" ON "public".%I
             FOR ALL TO authenticated USING (true) WITH CHECK (true)',
            t
        );
    END LOOP;
END $$;
