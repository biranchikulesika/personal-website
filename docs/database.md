# Database and Schema Architecture

The database architecture is built on PostgreSQL through Supabase. The entire schema is declaratively defined in a single, idempotent file: [`supabase/migrations/20260830000000_initial_schema.sql`](../supabase/migrations/20260830000000_initial_schema.sql). This is the only migration file tracked in Git. It recreates all tables, types, functions, triggers, indexes, Row Level Security (RLS) policies, and role grants.

---

## 1. Tables Overview

The database contains 10 tables in the `public` schema:

| Table | Purpose | Primary Key | Key Indexes and Constraints |
| :--- | :--- | :--- | :--- |
| `posts` | Long-form essays and writing | `id` (UUID) | UNIQUE(`slug`), `published_at DESC`, `status` |
| `notes` | Atomic short-form notes | `id` (TEXT) | UNIQUE(`slug`), `date DESC`, `status` |
| `books` | Reading catalog and book recommendations | `id` (TEXT) | UNIQUE(`slug`), `is_published` |
| `now_entries` | Living timeline entries | `id` (TEXT) | `created_at DESC`, `slug` |
| `media` | Uploaded images and asset metadata | `id` (TEXT) | `created_at DESC`, `tag` |
| `featured_items` | Curated homepage featured essays and books | `id` (UUID) | UNIQUE(`item_type`, `item_id`), UNIQUE(`item_type`, `position`) |
| `user_roles` | Role-based authorization mappings | `user_id` (UUID FK) | `role` (`user`, `content_admin`, `super_admin`) |
| `storage_files` | Tracked storage assets for orphan detection | `id` (UUID) | UNIQUE(`path`) |
| `subscribers` | Newsletter subscriber registry | `id` (TEXT) | `email`, CHECK `status` IN ('active', 'unsubscribed') |
| `contributions` | Patronage and Razorpay payment records | `id` (TEXT) | `payment_id`, `order_id`, `created_at DESC` |

---

## 2. Custom Types and Enums

```sql
-- Role levels for authenticated users
CREATE TYPE public.app_role AS ENUM ('user', 'content_admin', 'super_admin');

-- Publication status for content items
CREATE TYPE public.content_status AS ENUM ('published', 'unpublished');

-- Editorial state for posts
CREATE TYPE public.post_status AS ENUM ('draft', 'published', 'archived');
```

---

## 3. Key Table Specifications

### `posts`
```sql
CREATE TABLE IF NOT EXISTS public.posts (
    id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug             TEXT NOT NULL UNIQUE,
    title            TEXT NOT NULL,
    subtitle         TEXT,
    description      TEXT DEFAULT '' NOT NULL,
    persona          TEXT,
    tags             TEXT[] DEFAULT '{}',
    published_at     DATE,
    last_edited_at   DATE,
    assumed_audience TEXT DEFAULT '',
    intro            JSONB DEFAULT '[]'::jsonb,
    sections         JSONB DEFAULT '[]'::jsonb,
    books            JSONB DEFAULT '[]'::jsonb,
    cover_image      TEXT,
    status           content_status DEFAULT 'published' NOT NULL,
    created_at       TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at       TIMESTAMPTZ DEFAULT now() NOT NULL
);
```

### `notes`
```sql
CREATE TABLE IF NOT EXISTS public.notes (
    id             TEXT PRIMARY KEY,
    slug           TEXT NOT NULL UNIQUE,
    title          TEXT NOT NULL,
    subtitle       TEXT,
    description    TEXT DEFAULT '' NOT NULL,
    content        JSONB DEFAULT '[]'::jsonb,
    date           TEXT DEFAULT '' NOT NULL,
    persona        TEXT,
    tags           TEXT[] DEFAULT '{}',
    cover_image    TEXT,
    status         content_status DEFAULT 'published' NOT NULL,
    created_at     TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at     TIMESTAMPTZ DEFAULT now() NOT NULL
);
```

### `books`
```sql
CREATE TABLE IF NOT EXISTS public.books (
    id             TEXT PRIMARY KEY,
    slug           TEXT NOT NULL UNIQUE,
    title          TEXT NOT NULL,
    author         TEXT NOT NULL,
    description    TEXT DEFAULT '' NOT NULL,
    date           TEXT,
    persona        TEXT,
    tags           TEXT[] DEFAULT '{}',
    cover          TEXT,
    link           TEXT,
    is_published   BOOLEAN DEFAULT true NOT NULL,
    status         TEXT DEFAULT 'published' NOT NULL,
    created_at     TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at     TIMESTAMPTZ DEFAULT now() NOT NULL
);
```

### `now_entries`
```sql
CREATE TABLE IF NOT EXISTS public.now_entries (
    id             TEXT PRIMARY KEY,
    slug           TEXT DEFAULT '' NOT NULL,
    title          TEXT NOT NULL,
    date           TEXT NOT NULL,
    content        TEXT DEFAULT '' NOT NULL,
    location       TEXT DEFAULT '' NOT NULL,
    status         content_status DEFAULT 'published' NOT NULL,
    created_at     TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at     TIMESTAMPTZ DEFAULT now() NOT NULL,
    last_edited_at TIMESTAMPTZ
);
```

### `subscribers`
```sql
CREATE TABLE IF NOT EXISTS public.subscribers (
    id         TEXT PRIMARY KEY,
    email      TEXT NOT NULL,
    status     TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'unsubscribed')),
    source     TEXT DEFAULT 'website' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
```

### `contributions`
```sql
CREATE TABLE IF NOT EXISTS public.contributions (
    id         TEXT PRIMARY KEY,
    order_id   TEXT,
    payment_id TEXT,
    amount     NUMERIC NOT NULL,
    currency   TEXT DEFAULT 'INR' NOT NULL,
    status     TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'captured', 'failed')),
    name       TEXT DEFAULT 'Anonymous Patron' NOT NULL,
    email      TEXT,
    note       TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    source     TEXT DEFAULT 'razorpay' NOT NULL CHECK (source IN ('razorpay', 'manual'))
);
```

---

## 4. Functions and Triggers

### Cross-Collection Slug Uniqueness
To guarantee URL routes `/p/[slug]`, `/n/[slug]`, and `/library` do not collide, the function `check_cross_collection_slug_uniqueness` runs before insert or update on `posts`, `notes`, and `books`:

```sql
CREATE OR REPLACE FUNCTION public.check_cross_collection_slug_uniqueness() RETURNS trigger
LANGUAGE plpgsql AS $$
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
$$;
```

### Security Helper Functions
1. **`is_admin()`**: Returns `true` if `auth.uid()` has role `content_admin` or `super_admin` in `public.user_roles`.
2. **`is_super_admin()`**: Returns `true` if `auth.uid()` has role `super_admin`.

Both functions are marked `SECURITY DEFINER` and set their `search_path` to `public` to prevent search path hijacking.

---

## 5. Row Level Security (RLS)

RLS is enabled on every public table:

- **Public Read Access**: Anonymous and authenticated users can view records where `status = 'published'` for `posts` and `notes`, and all records for `books`, `now_entries`, `featured_items`, and `media`.
- **User Self-Inspection**: Users can read their own role from `user_roles` (`auth.uid() = user_id`).
- **Private Data**: The `contributions` table and `subscribers` table cannot be read by public anonymous users, protecting patron and subscriber privacy.
- **Admin Access**: Authenticated users matching `is_admin()` receive full read, insert, update, and delete privileges.
- **Service Role**: `service_role` has full access to all tables, used by server actions and API route handlers via `getSupabaseAdmin()`.

---

## 6. How to Apply Schema Changes

All schema changes must be applied directly to `supabase/migrations/20260830000000_initial_schema.sql`.

1. Write idempotent SQL statements (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `DROP POLICY IF EXISTS`).
2. Apply changes to your local Supabase database:
   ```bash
   psql postgres://postgres:postgres@127.0.0.1:54322/postgres -f supabase/migrations/20260830000000_initial_schema.sql
   ```
3. Apply changes to the live linked Supabase database before merging or building:
   ```bash
   supabase db query --linked -f supabase/migrations/20260830000000_initial_schema.sql
   ```
