# Database & Schema Architecture

The database architecture is built on PostgreSQL / Supabase. The entire schema is declaratively defined in a single, idempotent file at the root: **[`schema.sql`](file:///home/biranchikulesika/Projects/biranchi/schema.sql)**.

---

## 1. Tables Overview

| Table | Purpose | Primary Key | Key Indexes & Constraints |
| :--- | :--- | :--- | :--- |
| `posts` | Long-form essays | `id` (UUID) | `slug` (UNIQUE), `published_at DESC`, `status` |
| `notes` | Atomic short-form notes | `id` (TEXT) | `slug` (UNIQUE), `date DESC`, `status` |
| `books` | Library reading catalog | `id` (TEXT) | `slug` (UNIQUE), `persona` |
| `now_entries` | Living focus timeline | `id` (TEXT) | `date DESC` |
| `media` | Uploaded images & asset catalog | `id` (TEXT) | `tag` |
| `featured_items` | Homepage featured essays & books | `id` (UUID) | UNIQUE(`item_type`, `item_id`), UNIQUE(`item_type`, `position`) |
| `user_roles` | Auth user RBAC role mappings | `user_id` (UUID FK) | `role` (`user`, `content_admin`, `super_admin`) |
| `storage_files` | Storage asset orphan tracker | `id` (UUID) | `path` (UNIQUE) |
| `contributions` | Razorpay & support payments | `id` (TEXT) | `payment_id`, `order_id`, `created_at DESC` |

---

## 2. Table Specifications

### `posts`
```sql
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
```

### `notes`
```sql
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
```

### `books`
```sql
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
```

### `contributions`
```sql
CREATE TABLE public.contributions (
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
```

---

## 3. Database Functions & Triggers

### 1. Automatic Timestamp Updates (`update_updated_at_column`)
All core tables attach a trigger that automatically updates the `updated_at` column whenever a record is modified.

### 2. Cross-Collection Slug Uniqueness (`check_cross_collection_slug_uniqueness`)
To ensure URL routing remains collision-free, a PL/pgSQL trigger verifies that a slug in `posts`, `notes`, or `books` does not already exist in any other collection:

```sql
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
```

---

## 4. Row Level Security (RLS) Policies

RLS is enabled on all tables:

1. **Public Read Policies**:
   - `posts` / `notes`: Public can read records where `status = 'published'`.
   - `books` / `now_entries` / `media` / `featured_items`: Public can read all records.
   - `user_roles`: Authenticated users can only read their own role (`auth.uid() = user_id`).
   - `contributions`: Not readable by public (protects patron PII).
2. **Authenticated / Service Role Full Access**:
   - Service-role key (`getSupabaseAdmin()`) automatically bypasses RLS for admin actions, background jobs, and API routes.
   - Authenticated admin users are granted full CRUD access via `"Authenticated full access"` policies.

---

## 5. Storage Buckets

The `media` bucket is configured in Supabase Storage:
- **Bucket ID**: `media`
- **Public URL**: `true`
- **File Size Limit**: `50 MB` (`52428800 bytes`)
- **Allowed MIME Types**: `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/svg+xml`, `application/pdf`
- **RLS**:
  - `SELECT`: Public access.
  - `INSERT`, `UPDATE`, `DELETE`: Authenticated users / service role only.

---

## 6. How to Apply Schema Changes

1. Edit [`schema.sql`](file:///home/biranchikulesika/Projects/biranchi/schema.sql) directly.
2. Ensure every statement remains **idempotent**:
   - `CREATE TABLE IF NOT EXISTS`
   - `CREATE INDEX IF NOT EXISTS`
   - `DROP TRIGGER IF EXISTS ... CREATE TRIGGER`
   - `DROP POLICY IF EXISTS ... CREATE POLICY`
   - `INSERT ... ON CONFLICT DO UPDATE`
3. Execute against Supabase:
   ```bash
   # Via Supabase SQL Editor: paste schema.sql
   # Or via Supabase CLI:
   supabase db push
   ```
4. Update [`lib/supabase/database.types.ts`](file:///home/biranchikulesika/Projects/biranchi/lib/supabase/database.types.ts) to keep TypeScript types strictly in sync.
