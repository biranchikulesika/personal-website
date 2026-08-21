# Deployment & Production Guidelines

This guide details how to build, configure, and deploy the application to a production environment.

---

## 1. Production Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare / Vercel Edge                 │
│              (SSL Termination, CDN Cache, DDoS)             │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Next.js Production Runtime                  │
│       (Node.js 24+ standalone output / Vercel Serverless)   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Managed Cloud                   │
│         - PostgreSQL 16 Database                            │
│         - Supabase Storage ('media' bucket)                 │
│         - Supabase Auth                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Build Artifacts (`output: 'standalone'`)

`next.config.ts` specifies `output: 'standalone'`.

When `npm run build` executes:
- Next.js automatically bundles only the production dependencies into `.next/standalone`.
- Static assets are placed in `.next/static` and `public/`.
- Enables running the entire application as a minimal containerized Node process (`node server.js`).

---

## 3. Database Deployment Checklist

Before deploying the application code:
1. Create a Supabase project.
2. Open the Supabase SQL Editor.
3. Paste and execute [`schema.sql`](file:///home/biranchikulesika/Projects/biranchi/schema.sql).
4. Verify that:
   - All 9 tables exist in the `public` schema.
   - Triggers for `updated_at` and cross-collection slug uniqueness are active.
   - The `media` storage bucket is created with public read access.
   - RLS is enabled on all tables.

---

## 4. Security Headers (`next.config.ts`)

Next.js automatically attaches HTTP security headers to all production responses:
- **`X-Content-Type-Options`**: `nosniff` (prevents MIME sniffing).
- **`X-Frame-Options`**: `DENY` (prevents clickjacking).
- **`X-XSS-Protection`**: `1; mode=block`.
- **`Referrer-Policy`**: `strict-origin-when-cross-origin`.
- **`Permissions-Policy`**: `camera=(), microphone=(), geolocation=(), browsing-topics=()`.
- **`Strict-Transport-Security`**: `max-age=63072000; includeSubDomains; preload` (HSTS).
- **`X-Robots-Tag`**: `noindex, nofollow` applied strictly to all `/admin/:path*` routes.

---

## 5. Pre-Deployment Verification Checklist

Always run these three commands locally or in CI before promoting a deployment:

```bash
# 1. Verify code formatting and linting
npm run lint

# 2. Run all unit and integration tests
npm test

# 3. Ensure TypeScript compiles and static pages generate successfully
npm run build
```
