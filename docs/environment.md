# Environment Variables Reference

This document is the reference for configuring environment variables across local development, testing, and production.

---

## 1. Environment Files Hierarchy

Next.js loads environment files in the following order of precedence, from highest to lowest:

```text
1. .env.local              Local development overrides (gitignored)
2. .env.production / .env  Production or shared defaults
3. .env.example            Committed local development template
4. .env.production.example Committed production deployment checklist
```

### Which File to Use:
- **Local Development**: Copy `.env.example` to `.env.local`:
  ```bash
  cp .env.example .env.local
  ```
- **Production Deployment**: Configure host environment variables using `.env.production.example` as your reference.

> **Local Google OAuth Note**: The Supabase CLI (`supabase start`) reads OAuth provider secrets from the shell environment, not from `.env.local`. If the Google login button locally returns `401: invalid_client`, export the credentials into your shell before starting the CLI:
> ```bash
> export $(grep -E '^(GOOGLE_CLIENT_ID|GOOGLE_CLIENT_SECRET)=' .env.local | xargs)
> supabase start
> ```
> Never commit OAuth secrets to `supabase/config.toml`. Keep them in `.env.local`.

---

## 2. Master Variable Reference

### `NEXT_PUBLIC_SITE_URL`
- **Purpose**: Canonical public base URL of the website.
- **Used by**: `lib/constants.ts`, `lib/seo.ts`, `lib/config/env.ts` for canonical links, sitemaps, JSON-LD, and OAuth redirects.
- **Expected format**: Absolute URL without trailing slash (for example, `https://biranchikulesika.com` or `http://localhost:3000`).
- **Exposure**: Client-safe (`NEXT_PUBLIC_` prefix).
- **Required**: Yes.

---

### `DATABASE_URL`
- **Purpose**: PostgreSQL connection string for Drizzle ORM database operations.
- **Used by**: `lib/config/env.ts` (`getDatabaseUrl`), `lib/db/client.ts`, and `lib/repositories/drizzle-content.repository.ts`.
- **Expected format**:
  - **Local Development**: `postgresql://postgres:postgres@127.0.0.1:54322/postgres` (Supabase CLI) or `postgresql://postgres:postgres@localhost:5432/biranchi_dev` (Docker).
  - **Production (Supabase)**: `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require`. Always use **Transaction Mode (port 6543)** in serverless hosting (e.g. Vercel) to avoid connection pool exhaustion.
- **Exposure**: **Server-only (Secret)**. Contains database credentials.
- **Required**: Yes (to activate Drizzle ORM). If omitted in production, the application gracefully falls back to `SupabaseContentRepository` using the PostgREST client.

---

### `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_URL`
- **Purpose**: Supabase project API gateway URL.
- **Used by**: `lib/config/env.ts` (`getSupabaseUrl`), `@supabase/ssr`, and `@supabase/supabase-js`.
- **Expected format**: `https://<project-ref>.supabase.co` or `http://127.0.0.1:54321` locally.
- **Exposure**: Client-safe.
- **Required**: Yes.

---

### `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Purpose**: Supabase anonymous public API key. Authorizes public client and server queries governed by Row Level Security (RLS).
- **Used by**: `lib/config/env.ts` (`getSupabasePublishableKey`).
- **Expected format**: JWT string (`eyJhbGciOi...`) or modern token (`sb_pub_...`).
- **Exposure**: Client-safe.
- **Required**: Yes.

---

### `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_SECRET_KEY`
- **Purpose**: Supabase service-role secret key. Bypasses RLS for administrative mutations and server operations.
- **Used by**: `lib/config/env.ts` (`getSupabaseSecretKey`) and `lib/supabase/server.ts` (`getSupabaseAdmin`).
- **Expected format**: Secret JWT token.
- **Exposure**: **Server-only (Secret)**. Never prefix with `NEXT_PUBLIC_` or import into client components.
- **Required**: Yes.

---

### `SUPABASE_JWT_SECRET`
- **Purpose**: Supabase project JWT secret. Used as an HMAC signing key for WebAuthn passkey challenge cookies and tokens.
- **Used by**: `lib/auth/webauthn.ts`.
- **Expected format**: 32+ character random secret string.
- **Exposure**: **Server-only (Secret)**.
- **Required**: Optional (falls back to `SUPABASE_SERVICE_ROLE_KEY`).

---

### `RAZORPAY_KEY_ID` / `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- **Purpose**: Razorpay public Key ID for patronage checkouts on `/support`.
- **Used by**: `components/support-page.tsx`.
- **Expected format**: `rzp_test_...` or `rzp_live_...`.
- **Exposure**: Client-safe.
- **Required**: Optional (needed only for payment processing).

---

### `RAZORPAY_KEY_SECRET`
- **Purpose**: Razorpay API secret key for HMAC-SHA256 signature verification during client payment confirmation.
- **Used by**: `lib/services/content.service.ts` and `lib/razorpay.ts`.
- **Exposure**: **Server-only (Secret)**.
- **Required**: Optional (needed only for payment verification).

---

### `RAZORPAY_WEBHOOK_SECRET`
- **Purpose**: Secret configured in the Razorpay Webhook Dashboard to verify incoming webhook payloads at `/api/webhooks/razorpay`.
- **Used by**: `app/api/webhooks/razorpay/route.ts` and `lib/razorpay.ts`.
- **Exposure**: **Server-only (Secret)**.
- **Required**: Optional (needed only for webhook verification).

---

### `PEXELS_API_KEY`
- **Purpose**: API key for Pexels image search, used for book cover lookups and daily login wallpapers.
- **Used by**: `lib/services/pexels.service.ts` and `app/api/login-background/route.ts`.
- **Exposure**: **Server-only (Secret)**.
- **Required**: Optional (falls back to local curated images if unset).

---

### `GROQ_API_KEY` / `OPENAI_API_KEY` / `AI_MODEL`
- **Purpose**: LLM provider credentials for generating document metadata (persona suggestions, tags, summaries) in the composer.
- **Used by**: `lib/services/ai-metadata.service.ts`.
- **Exposure**: **Server-only (Secret)**.
- **Required**: Optional (falls back to heuristic rule-based extraction if unset).

---

### `NEXT_PUBLIC_GA_ID` / `NEXT_PUBLIC_GOOGLE_TAG_ID` / `NEXT_PUBLIC_GTAG_ID`
- **Purpose**: Google Analytics 4 Measurement ID.
- **Used by**: `components/google-analytics.tsx`.
- **Expected format**: `G-XXXXXXXXXX`.
- **Exposure**: Client-safe.
- **Required**: Optional (analytics scripts are omitted if unset).

---

### `NEXT_PUBLIC_GTM_ID`
- **Purpose**: Google Tag Manager container ID.
- **Used by**: `components/google-tag-manager.tsx`.
- **Expected format**: `GTM-XXXXXXX`.
- **Exposure**: Client-safe.
- **Required**: Optional (GTM scripts are omitted if unset).

---

## 3. Credential Rotation Guidelines

### If `SUPABASE_SERVICE_ROLE_KEY` is Compromised:
1. Open the Supabase Dashboard, go to Project Settings, then API.
2. Generate a new service-role secret key.
3. Update `SUPABASE_SERVICE_ROLE_KEY` in your hosting dashboard immediately.
4. Redeploy the application.

### If `RAZORPAY_KEY_SECRET` is Compromised:
1. Open the Razorpay Dashboard, go to Account and Settings, then API Keys.
2. Click Regenerate Key.
3. Update `RAZORPAY_KEY_SECRET` in your hosting settings and redeploy.

### If `RAZORPAY_WEBHOOK_SECRET` is Compromised:
1. Open the Razorpay Dashboard, go to Webhooks.
2. Edit the active webhook and generate a new secret.
3. Update `RAZORPAY_WEBHOOK_SECRET` in your hosting settings.
