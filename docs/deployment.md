# Deployment and Production Guidelines

This guide details how to build, configure, and deploy the application to production.

---

## 1. Production Architecture Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                    Edge CDN / DNS Layer                     │
│              (SSL Termination, Edge Caching)                │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Next.js Production Runtime                  │
│       (Node.js 24+ standalone output or Vercel Serverless)  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Managed Cloud                   │
│         - PostgreSQL Database (10 tables)                   │
│         - Supabase Storage ('media' bucket)                 │
│         - Supabase Auth                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Build Artifacts (`output: 'standalone'`)

`next.config.ts` specifies `output: 'standalone'`.

When `npm run build` executes:
- Next.js traces runtime dependencies and creates a self-contained bundle in `.next/standalone`.
- Only production packages are included. Test files, scripts, documentation, and `devDependencies` are omitted.
- The standalone build can run on any host with Node.js installed using `node server.js`.

---

## 3. Database Deployment Checklist

Before deploying code that depends on database updates:
1. All schema modifications must be added to `supabase/migrations/20260830000000_initial_schema.sql`.
2. Apply the schema to the live Supabase database before triggering builds:
   ```bash
   supabase db query --linked -f supabase/migrations/20260830000000_initial_schema.sql
   ```
3. Verify that:
   - All 10 tables exist in the `public` schema (`posts`, `notes`, `books`, `now_entries`, `media`, `featured_items`, `user_roles`, `storage_files`, `subscribers`, `contributions`).
   - Triggers for `update_updatedAt_column` and `check_cross_collection_slug_uniqueness` are active.
   - The `media` storage bucket exists with public read access.
   - Row Level Security (RLS) is enabled on all tables.

### Production Drizzle & Supabase Setup

To enable Drizzle ORM in production with Supabase:

1. **Get Transaction Pooler URI (Port 6543)**:
   - In Supabase Dashboard, go to **Project Settings** -> **Database**.
   - Under **Connection string**, select **URI**.
   - Set **Mode** to **Transaction** (port `6543`).
   - **Crucial**: Always use port `6543` (Transaction mode) for serverless deployments on Vercel. Do not use session mode (port `5432`), which quickly exhausts connections.
   - Format: `postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require`

2. **Configure Host Environment Variables (Vercel)**:
   Ensure these 5 core variables are set in your Vercel Project Settings:
   - `DATABASE_URL`: Transaction Pooler URI (starts with `postgresql://` on port `6543`).
   - `NEXT_PUBLIC_SITE_URL`: Canonical URL without trailing slash (e.g. `https://biranchikulesika.com`).
   - `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL (`https://[REF].supabase.co`).
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Public anonymous key for client interactions.
   - `SUPABASE_SECRET_KEY`: Service-role key for admin mutations, user roles, and storage.

3. **Fallback Safety**:
   If `DATABASE_URL` is omitted in production, the application automatically falls back to `SupabaseContentRepository` without crashing. Adding `DATABASE_URL` switches the database driver to Drizzle ORM immediately.

---

## 4. Security Headers (`next.config.ts`)

Next.js automatically attaches HTTP security headers to all responses:
- **`Content-Security-Policy`**: Restricts scripts, styles, frames, images, and connections to approved origins.
- **`Cross-Origin-Opener-Policy`**: `same-origin-allow-popups` (allows OAuth popups to communicate cleanly).
- **`X-Content-Type-Options`**: `nosniff` (prevents MIME type sniffing).
- **`X-Frame-Options`**: `SAMEORIGIN` (prevents clickjacking while allowing same-origin frames).
- **`X-XSS-Protection`**: `1; mode=block`.
- **`Referrer-Policy`**: `strict-origin-when-cross-origin`.
- **`Permissions-Policy`**: `camera=(), microphone=(), geolocation=(), browsing-topics=()`.
- **`Strict-Transport-Security`**: `max-age=63072000; includeSubDomains; preload` (HSTS).
- **`X-Robots-Tag`**: `noindex, nofollow` applied strictly to all `/admin/:path*` routes.

---

## 5. Deployment Verification Checklist

Always run these verification commands before promoting a deployment:

```bash
# 1. Run static code analysis and linting
npm run lint

# 2. Run TypeScript compiler typechecks
npm run typecheck

# 3. Run all unit and integration tests
npm test

# 4. Verify production build and static pre-rendering
npm run build
```

If any step reports an error, stop and resolve the issue before deploying.
