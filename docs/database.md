# Database and Schema Architecture

The database architecture is built on PostgreSQL, designed to run portably across any PostgreSQL host (local Docker, Supabase Postgres, Neon, AWS RDS, or VPS). Data access is driven by Drizzle ORM with TypeScript schemas defined in `lib/db/schema/`.

The database schema is also declaratively maintained in [`supabase/migrations/20260830000000_initial_schema.sql`](../supabase/migrations/20260830000000_initial_schema.sql) and tracked via Drizzle migrations in `drizzle/`.

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

## 6. Drizzle ORM Schemas & Database Independence

Drizzle ORM serves as the database query engine, providing static TypeScript type safety without locking the application into a single vendor.

### Schema Files (`lib/db/schema/`)
- `posts.ts`: Schema for `public.posts` table and `content_status` enum.
- `notes.ts`: Schema for `public.notes` table.
- `books.ts`: Schema for `public.books` table.
- `now-entries.ts`: Schema for `public.now_entries` table.
- `media.ts`: Schema for `public.media` table.
- `featured.ts`: Schema for `public.featured_items` table.
- `subscribers.ts`: Schema for `public.subscribers` table.
- `user-roles.ts`: Schema for `public.user_roles` table and `app_role` enum.
- `contributions.ts`: Schema for `public.contributions` table.
- `storage-files.ts`: Schema for `public.storage_files` table.
- `index.ts`: Unified export of all schemas.

### Connection Management (`lib/db/client.ts`)
The Drizzle client connects via the `postgres` driver using `DATABASE_URL`. In development mode, the client connection is cached globally to survive Next.js Fast Refresh cycles without exhausting database connection pools.

### Local PostgreSQL Options
Developers can run PostgreSQL locally through either:
1. **Supabase Local CLI**: `supabase start` (PostgreSQL available at `127.0.0.1:54322`).
2. **Docker Compose**: `docker compose up -d` using `docker-compose.yml` (PostgreSQL 17 Alpine on port `5432`).

---

## 7. How to Apply Schema Changes

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
4. If schema definitions changed, update `lib/db/schema/*.ts` and generate fresh Drizzle migrations:
   ```bash
   npx drizzle-kit generate
   ```

---

## 8. Production Drizzle Setup with Supabase

The production deployment uses Supabase as the managed infrastructure provider for PostgreSQL, authentication, and media storage, with Drizzle ORM driving all content queries and mutations.

### Why the Transaction Pooler (Port 6543) Is Required

In serverless hosting environments such as Vercel, every incoming request or Server Action can spin up an ephemeral container. Connecting directly to PostgreSQL via the session port (`5432`) would create a separate TCP connection per container, quickly exhausting PostgreSQL connection limits (`max_connections`).

Supabase provides a built-in connection pooler (Supavisor) configured for transaction pooling:
- **Port 6543 (Transaction Mode)**: Connections are pooled per transaction and released immediately upon query completion. This mode supports thousands of concurrent serverless requests and is required for production.
- **Port 5432 (Session Mode)**: Retains connection state until the client disconnects. Do not use session mode in serverless environments.

### Step-by-Step Production Configuration

#### Step 1: Obtain the Transaction Pooler Connection String
1. Log in to the [Supabase Dashboard](https://supabase.com/dashboard) and open your production project.
2. Go to **Project Settings** (gear icon) -> **Database**.
3. Scroll down to the **Connection string** section and select the **URI** tab.
4. Set the **Mode** selector to **Transaction** (notice the port changes to `6543`).
5. Copy the connection string. It will look like:
   ```text
   postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[YOUR-REGION].pooler.supabase.com:6543/postgres
   ```
6. Replace `[YOUR-PASSWORD]` with your real database password.
7. Append `?sslmode=require` to enforce TLS:
   ```text
   postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[YOUR-REGION].pooler.supabase.com:6543/postgres?sslmode=require
   ```

#### Step 2: Configure Environment Variables in Production (Vercel)
In your hosting provider dashboard (e.g. Vercel Project Settings -> Environment Variables), configure the following keys:

| Environment Variable | Value / Description | Exposure |
| :--- | :--- | :--- |
| `DATABASE_URL` | Transaction Pooler URI from Step 1 (`...:6543/postgres?sslmode=require`) | Server-only (Secret) |
| `NEXT_PUBLIC_SITE_URL` | Canonical domain (e.g. `https://biranchikulesika.com`) | Client-safe |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API gateway (e.g. `https://[ref].supabase.co`) | Client-safe |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anonymous public API key (`eyJ...`) | Client-safe |
| `SUPABASE_SECRET_KEY` | Supabase service-role secret key (required for media uploads and admin access) | Server-only (Secret) |

Optional patronage keys if accepting support:
- `RAZORPAY_KEY_ID` (public key)
- `RAZORPAY_KEY_SECRET` (server secret)

#### Step 3: Automatic Drizzle Activation and Fallback
The repository factory in `lib/repositories/index.ts` automatically detects the environment:
- When `DATABASE_URL` is present, the app instantiates `DrizzleContentRepository`, routing all reading catalog, essay, note, and timeline queries directly through Drizzle ORM.
- If `DATABASE_URL` is unset or omitted, the factory falls back to `SupabaseContentRepository` using the PostgREST client.
- This ensures zero-downtime safety: if `DATABASE_URL` is missing during a quick redeploy, public pages continue functioning.

#### Step 4: Verification
After deploying to production:
1. Check the build logs to ensure static pre-rendering completes cleanly without database connection timeouts.
2. Verify that public pages (`/`, `/library`, `/now`, `/p/[slug]`) load accurately with live content.
3. Test an administrative update in `/admin` (e.g. editing a note or now entry) to confirm write mutations succeed through Drizzle.

---

## 9. Future Provider Portability

While Supabase is currently the active infrastructure provider, the codebase uses strict layered abstraction:

- **Database**: Drizzle ORM queries PostgreSQL using standard SQL. If migrating to AWS RDS, Neon, or a self-hosted PostgreSQL VPS in the future, only the `DATABASE_URL` connection string needs to change. No application code or queries need updating.
- **Media Storage**: Abstracted behind the `MediaStorage` interface (`lib/storage/media-storage.ts`). Currently implemented by `SupabaseMediaStorage`. Can be swapped to S3, Cloudflare R2, or local disk by adding an implementation to `lib/storage/`.
- **Authentication**: Abstracted behind the `AuthService` interface (`lib/auth/auth-service.ts`). Currently implemented by `SupabaseAuthService`. Can be swapped to Auth.js or custom sessions by providing an implementation to `lib/auth/`.

