-- =============================================================================
-- RESET: Drop all application tables and recreate clean schema.
-- =============================================================================
-- This migration completely resets the application data layer.
-- Auth tables (auth.users, auth.sessions, etc.) are preserved.
-- NO seed data is included. The database starts empty.
-- =============================================================================

-- ── Drop existing application tables ────────────────────────────────────────

DO $$ DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'posts', 'notes', 'books', 'now_entries', 'media',
    'admin_profile', 'storage_files', 'user_roles', 'featured_items',
    -- Legacy tables from previous implementation
    'active_systems', 'build_logs', 'builder_status', 'donations',
    'field_notes', 'fragments', 'image_cleanup_logs', 'journal_moments',
    'newsletter_issues', 'newsletter_profiles', 'operator_focuses',
    'passkey_credentials', 'questions', 'redistribution_records',
    'subscribers', 'subscriptions', 'thought_fragments', 'uploaded_images'
  ]) LOOP
    IF EXISTS (
      SELECT 1 FROM pg_class
      WHERE relname = t
      AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) THEN
      EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON public.%I', t);
      EXECUTE format('DROP TRIGGER IF EXISTS trg_posts_slug_uniqueness ON public.%I', t);
      EXECUTE format('DROP TRIGGER IF EXISTS trg_notes_slug_uniqueness ON public.%I', t);
      EXECUTE format('DROP TRIGGER IF EXISTS trg_books_slug_uniqueness ON public.%I', t);
      EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', t);
    END IF;
  END LOOP;
END $$;

-- Drop functions and types
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.check_cross_collection_slug_uniqueness() CASCADE;
DROP TYPE IF EXISTS public.content_status;
DROP TYPE IF EXISTS public.app_role;

-- ── Enums ───────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE public.content_status AS ENUM ('published', 'unpublished');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('user', 'content_admin', 'super_admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ── Helper Functions ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.check_cross_collection_slug_uniqueness()
RETURNS TRIGGER AS $$
DECLARE
  existing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO existing_count
  FROM (
    SELECT slug FROM public.posts WHERE slug = NEW.slug AND TG_TABLE_NAME != 'posts'
    UNION ALL
    SELECT slug FROM public.notes WHERE slug = NEW.slug AND TG_TABLE_NAME != 'notes'
    UNION ALL
    SELECT slug FROM public.books WHERE slug = NEW.slug AND TG_TABLE_NAME != 'books'
  ) AS conflicts;

  IF existing_count > 0 THEN
    RAISE EXCEPTION 'Slug "%" already exists in another collection. Choose a unique slug.', NEW.slug;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── User Roles ──────────────────────────────────────────────────────────────
-- Maps Supabase auth users to application roles.
-- Roles: user (no admin access), content_admin, super_admin.

CREATE TABLE public.user_roles (
  user_id   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role      app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_roles_role ON public.user_roles(role);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── Posts ───────────────────────────────────────────────────────────────────

CREATE TABLE public.posts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT NOT NULL UNIQUE,
  title            TEXT NOT NULL,
  subtitle         TEXT,
  description      TEXT NOT NULL DEFAULT '',
  persona          TEXT,
  tags             TEXT[] DEFAULT '{}',
  published_at     DATE,
  last_edited_at   DATE,
  assumed_audience TEXT DEFAULT '',
  intro            JSONB DEFAULT '[]'::jsonb,
  sections         JSONB DEFAULT '[]'::jsonb,
  books            JSONB DEFAULT '[]'::jsonb,
  cover_image      TEXT,
  status           content_status NOT NULL DEFAULT 'published',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_posts_slug ON public.posts(slug);
CREATE INDEX idx_posts_status ON public.posts(status);
CREATE INDEX idx_posts_published_at ON public.posts(published_at DESC NULLS LAST);
CREATE INDEX idx_posts_persona ON public.posts(persona);

CREATE TRIGGER trg_posts_slug_uniqueness
  BEFORE INSERT OR UPDATE OF slug ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.check_cross_collection_slug_uniqueness();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── Notes ───────────────────────────────────────────────────────────────────

CREATE TABLE public.notes (
  id             TEXT PRIMARY KEY,
  slug           TEXT NOT NULL UNIQUE,
  title          TEXT NOT NULL,
  description    TEXT NOT NULL DEFAULT '',
  content        JSONB DEFAULT '[]'::jsonb,
  date           DATE,
  persona        TEXT,
  tags           TEXT[] DEFAULT '{}',
  cover_image    TEXT,
  status         content_status NOT NULL DEFAULT 'published',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notes_slug ON public.notes(slug);
CREATE INDEX idx_notes_status ON public.notes(status);
CREATE INDEX idx_notes_date ON public.notes(date DESC NULLS LAST);
CREATE INDEX idx_notes_persona ON public.notes(persona);

CREATE TRIGGER trg_notes_slug_uniqueness
  BEFORE INSERT OR UPDATE OF slug ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.check_cross_collection_slug_uniqueness();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── Books ───────────────────────────────────────────────────────────────────

CREATE TABLE public.books (
  id             TEXT PRIMARY KEY,
  slug           TEXT NOT NULL UNIQUE,
  title          TEXT NOT NULL,
  author         TEXT NOT NULL,
  description    TEXT NOT NULL DEFAULT '',
  date           TEXT,
  persona        TEXT,
  tags           TEXT[] DEFAULT '{}',
  cover          TEXT,
  link           TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_books_slug ON public.books(slug);
CREATE INDEX idx_books_persona ON public.books(persona);

CREATE TRIGGER trg_books_slug_uniqueness
  BEFORE INSERT OR UPDATE OF slug ON public.books
  FOR EACH ROW EXECUTE FUNCTION public.check_cross_collection_slug_uniqueness();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.books
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── Now Entries ─────────────────────────────────────────────────────────────

CREATE TABLE public.now_entries (
  id             TEXT PRIMARY KEY,
  title          TEXT NOT NULL,
  date           TEXT NOT NULL,
  content        TEXT NOT NULL DEFAULT '',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_now_entries_date ON public.now_entries(date DESC);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.now_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── Media ───────────────────────────────────────────────────────────────────

CREATE TABLE public.media (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  src            TEXT NOT NULL,
  alt            TEXT NOT NULL DEFAULT '',
  size           TEXT NOT NULL DEFAULT '',
  dimensions     TEXT,
  uploaded_at    DATE,
  tag            TEXT NOT NULL DEFAULT 'atmosphere',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_media_tag ON public.media(tag);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.media
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── Featured Items ───────────────────────────────────────────────────────
-- Tracks which posts and books are featured on the homepage.

CREATE TABLE public.featured_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type      TEXT NOT NULL CHECK (item_type IN ('post', 'book')),
  item_id        TEXT NOT NULL,
  position       INTEGER NOT NULL CHECK (position BETWEEN 1 AND 4),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(item_type, item_id),
  UNIQUE(item_type, position)
);

CREATE INDEX idx_featured_items_type ON public.featured_items(item_type);

-- ── Storage Files (orphan detection) ────────────────────────────────────────

CREATE TABLE public.storage_files (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path           TEXT NOT NULL UNIQUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Row Level Security ──────────────────────────────────────────────────────

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.now_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_files ENABLE ROW LEVEL SECURITY;

-- Public read: featured items
CREATE POLICY "Public read all featured items"
  ON public.featured_items FOR SELECT
  USING (true);

-- Public read: published content only
CREATE POLICY "Public read published posts"
  ON public.posts FOR SELECT
  USING (status = 'published');

CREATE POLICY "Public read published notes"
  ON public.notes FOR SELECT
  USING (status = 'published');

CREATE POLICY "Public read all books"
  ON public.books FOR SELECT
  USING (true);

CREATE POLICY "Public read all now entries"
  ON public.now_entries FOR SELECT
  USING (true);

CREATE POLICY "Public read all media"
  ON public.media FOR SELECT
  USING (true);

-- user_roles: users can read their own role
CREATE POLICY "Users can read own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Authenticated full access for admin tables (service-role bypasses RLS anyway)
DO $$ DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'posts', 'notes', 'books', 'now_entries', 'media',
      'storage_files', 'user_roles', 'featured_items'
    ])
  LOOP
    EXECUTE format(
      'CREATE POLICY "Authenticated full access" ON public.%I
       FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      t
    );
  END LOOP;
END $$;

-- ── Storage: Media Bucket ───────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS media_select_public ON storage.objects;
DROP POLICY IF EXISTS media_insert_authenticated ON storage.objects;
DROP POLICY IF EXISTS media_update_authenticated ON storage.objects;
DROP POLICY IF EXISTS media_delete_authenticated ON storage.objects;

CREATE POLICY media_select_public
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

CREATE POLICY media_insert_authenticated
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

CREATE POLICY media_update_authenticated
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'media' AND auth.role() = 'authenticated');

CREATE POLICY media_delete_authenticated
  ON storage.objects FOR DELETE
  USING (bucket_id = 'media' AND auth.role() = 'authenticated');
