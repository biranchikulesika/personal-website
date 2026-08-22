-- =============================================================================
-- Biranchi Kulesika Website — Complete Idempotent Database Schema
-- =============================================================================
-- This script creates all required database tables, indexes, triggers,
-- functions, row-level security (RLS) policies, and storage buckets.
-- It contains ZERO seed data and is fully idempotent: running it multiple
-- times on any PostgreSQL/Supabase instance will not throw errors.
-- =============================================================================

-- ── Extensions ───────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Custom Types & Enums ─────────────────────────────────────────────────────

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

-- ── Helper Functions ─────────────────────────────────────────────────────────

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

-- ── User Roles ───────────────────────────────────────────────────────────────
-- Maps Supabase auth users to application roles (user, content_admin, super_admin).

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role       app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

DROP TRIGGER IF EXISTS set_updated_at ON public.user_roles;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── Posts (Long-form Essays) ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.posts (
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

CREATE INDEX IF NOT EXISTS idx_posts_slug ON public.posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON public.posts(published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_posts_persona ON public.posts(persona);

DROP TRIGGER IF EXISTS trg_posts_slug_uniqueness ON public.posts;
CREATE TRIGGER trg_posts_slug_uniqueness
  BEFORE INSERT OR UPDATE OF slug ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.check_cross_collection_slug_uniqueness();

DROP TRIGGER IF EXISTS set_updated_at ON public.posts;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── Notes (Short-form Atomic Thinking) ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.notes (
  id             TEXT PRIMARY KEY,
  slug           TEXT NOT NULL UNIQUE,
  title          TEXT NOT NULL,
  subtitle       TEXT,
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

CREATE INDEX IF NOT EXISTS idx_notes_slug ON public.notes(slug);
CREATE INDEX IF NOT EXISTS idx_notes_status ON public.notes(status);
CREATE INDEX IF NOT EXISTS idx_notes_date ON public.notes(date DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_notes_persona ON public.notes(persona);

DROP TRIGGER IF EXISTS trg_notes_slug_uniqueness ON public.notes;
CREATE TRIGGER trg_notes_slug_uniqueness
  BEFORE INSERT OR UPDATE OF slug ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.check_cross_collection_slug_uniqueness();

DROP TRIGGER IF EXISTS set_updated_at ON public.notes;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── Books (Library) ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.books (
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

CREATE INDEX IF NOT EXISTS idx_books_slug ON public.books(slug);
CREATE INDEX IF NOT EXISTS idx_books_persona ON public.books(persona);

DROP TRIGGER IF EXISTS trg_books_slug_uniqueness ON public.books;
CREATE TRIGGER trg_books_slug_uniqueness
  BEFORE INSERT OR UPDATE OF slug ON public.books
  FOR EACH ROW EXECUTE FUNCTION public.check_cross_collection_slug_uniqueness();

DROP TRIGGER IF EXISTS set_updated_at ON public.books;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.books
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── Now Entries (Current Focus & Timeline) ───────────────────────────────────

CREATE TABLE IF NOT EXISTS public.now_entries (
  id             TEXT PRIMARY KEY,
  title          TEXT NOT NULL,
  date           TEXT NOT NULL,
  content        TEXT NOT NULL DEFAULT '',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_now_entries_date ON public.now_entries(date DESC);

DROP TRIGGER IF EXISTS set_updated_at ON public.now_entries;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.now_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── Media (Uploaded Image & File Catalog) ───────────────────────────────────

CREATE TABLE IF NOT EXISTS public.media (
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

CREATE INDEX IF NOT EXISTS idx_media_tag ON public.media(tag);

DROP TRIGGER IF EXISTS set_updated_at ON public.media;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.media
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── Featured Items (Homepage Highlights) ────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.featured_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type      TEXT NOT NULL CHECK (item_type IN ('post', 'book')),
  item_id        TEXT NOT NULL,
  position       INTEGER NOT NULL CHECK (position BETWEEN 1 AND 4),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(item_type, item_id),
  UNIQUE(item_type, position)
);

CREATE INDEX IF NOT EXISTS idx_featured_items_type ON public.featured_items(item_type);

-- ── Storage Files (Orphan Asset Tracking) ───────────────────────────────────

CREATE TABLE IF NOT EXISTS public.storage_files (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path           TEXT NOT NULL UNIQUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Contributions & Patronage (Razorpay & Direct Support) ───────────────────

CREATE TABLE IF NOT EXISTS public.contributions (
  id             TEXT PRIMARY KEY,
  order_id       TEXT,
  payment_id     TEXT,
  amount         NUMERIC NOT NULL,
  currency       TEXT NOT NULL DEFAULT 'INR',
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'captured', 'failed')),
  name           TEXT NOT NULL DEFAULT 'Anonymous Patron',
  email          TEXT,
  note           TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source         TEXT NOT NULL DEFAULT 'razorpay' CHECK (source IN ('razorpay', 'manual'))
);

CREATE INDEX IF NOT EXISTS idx_contributions_payment_id ON public.contributions(payment_id);
CREATE INDEX IF NOT EXISTS idx_contributions_order_id ON public.contributions(order_id);
CREATE INDEX IF NOT EXISTS idx_contributions_created_at ON public.contributions(created_at DESC);

CREATE TABLE IF NOT EXISTS public.subscribers (
  id             TEXT PRIMARY KEY,
  email          TEXT NOT NULL UNIQUE,
  status         TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  source         TEXT NOT NULL DEFAULT 'website',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscribers_email ON public.subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_created_at ON public.subscribers(created_at DESC);

GRANT ALL ON TABLE public.subscribers TO anon, authenticated, service_role;

-- ── Row Level Security (RLS) ─────────────────────────────────────────────────

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.now_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- ── Public Read & Insert Policies ────────────────────────────────────────────

DROP POLICY IF EXISTS "Allow public newsletter subscriptions" ON public.subscribers;
CREATE POLICY "Allow public newsletter subscriptions"
  ON public.subscribers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public read all featured items" ON public.featured_items;
CREATE POLICY "Public read all featured items"
  ON public.featured_items FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public read published posts" ON public.posts;
CREATE POLICY "Public read published posts"
  ON public.posts FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS "Public read published notes" ON public.notes;
CREATE POLICY "Public read published notes"
  ON public.notes FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS "Public read all books" ON public.books;
CREATE POLICY "Public read all books"
  ON public.books FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public read all now entries" ON public.now_entries;
CREATE POLICY "Public read all now entries"
  ON public.now_entries FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public read all media" ON public.media;
CREATE POLICY "Public read all media"
  ON public.media FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
CREATE POLICY "Users can read own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- ── Security Definer Role Check Functions ──────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('content_admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ── Admin Content Access Policies ───────────────────────────────────────────

DO $$ DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'posts', 'notes', 'books', 'now_entries', 'media',
      'storage_files', 'featured_items'
    ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated full access" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Admin write access" ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY "Admin write access" ON public.%I
       FOR ALL TO authenticated
       USING (public.is_admin())
       WITH CHECK (public.is_admin())',
      t
    );
  END LOOP;
END $$;

-- ── User Roles Security Policies ─────────────────────────────────────────────

DROP POLICY IF EXISTS "Authenticated full access" ON public.user_roles;
DROP POLICY IF EXISTS "Super admin full access" ON public.user_roles;
CREATE POLICY "Super admin full access"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- ── Contributions Security Policies ─────────────────────────────────────────

DROP POLICY IF EXISTS "Authenticated full access" ON public.contributions;
DROP POLICY IF EXISTS "Admin access contributions" ON public.contributions;
CREATE POLICY "Admin access contributions"
  ON public.contributions FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── Subscribers Security Policies ───────────────────────────────────────────

DROP POLICY IF EXISTS "Authenticated full access" ON public.subscribers;
DROP POLICY IF EXISTS "Admin access subscribers" ON public.subscribers;
CREATE POLICY "Admin access subscribers"
  ON public.subscribers FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── Storage Bucket & Policies ────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS media_select_public ON storage.objects;
CREATE POLICY media_select_public
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

DROP POLICY IF EXISTS media_insert_authenticated ON storage.objects;
DROP POLICY IF EXISTS media_insert_admin ON storage.objects;
CREATE POLICY media_insert_admin
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'media' AND public.is_admin());

DROP POLICY IF EXISTS media_update_authenticated ON storage.objects;
DROP POLICY IF EXISTS media_update_admin ON storage.objects;
CREATE POLICY media_update_admin
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'media' AND public.is_admin());

DROP POLICY IF EXISTS media_delete_authenticated ON storage.objects;
DROP POLICY IF EXISTS media_delete_admin ON storage.objects;
CREATE POLICY media_delete_admin
  ON storage.objects FOR DELETE
  USING (bucket_id = 'media' AND public.is_admin());
