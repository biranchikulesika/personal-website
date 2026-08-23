# Environment Configuration & Variables Guide

This document is the definitive reference for configuring environment variables in the Biranchi Kulesika web platform across local development, testing, and production environments.

---

## 1. Environment Files Hierarchy

Next.js loads environment files in the following order of precedence (highest to lowest):

```
┌─────────────────────────────────────────────────────────────┐
│ 1. .env.local             (Local dev overrides, gitignored) │
├─────────────────────────────────────────────────────────────┤
│ 2. .env.production / .env (Production / shared defaults)    │
├─────────────────────────────────────────────────────────────┤
│ 3. .env.example           (Committed environment template)  │
├─────────────────────────────────────────────────────────────┤
│ 4. .env.production.example(Committed production template)   │
└─────────────────────────────────────────────────────────────┘
```

### Which File to Copy:

- **Local Development**: Copy `.env.example` to `.env.local`:
  ```bash
  cp .env.example .env.local
  ```
- **Production Deployment**: Configure host environment variables using `.env.production.example` as your checklist.

---

## 2. Master Variable Reference

---

### `NEXT_PUBLIC_SITE_URL`

1. **Variable name**: `NEXT_PUBLIC_SITE_URL`
2. **What it is**: Canonical public base URL of the website.
3. **Why the app needs it**: Generates canonical `<link rel="canonical">` tags, Open Graph image URLs, Schema.org JSON-LD IDs, `sitemap.xml` entries, and OAuth callback redirect URLs.
4. **Where to get it**: Set to `http://localhost:3000` for local dev; set to `https://biranchikulesika.com` in production.
5. **Expected format**: Absolute URL without trailing slash (e.g. `https://biranchikulesika.com`).
6. **Where it is used**:
   - `lib/constants.ts` -> `SITE_URL`
   - `lib/seo.ts` -> metadata builders & JSON-LD generators
7. **Server vs Client**: **Client-safe** (`NEXT_PUBLIC_` prefix).
8. **Security implications**: Public domain identifier. Ensure HTTPS is enforced in production.
9. **Common mistakes**: Adding a trailing slash (e.g. `https://biranchikulesika.com/`), causing double slashes (`//about`) in generated links.
10. **Troubleshooting**: If canonical links or social preview tags show `http://localhost:3000` on production, set `NEXT_PUBLIC_SITE_URL` in your hosting dashboard.
11. **Required**: **Yes** (Defaults to `http://localhost:3000`).
12. **Environment behavior**: Local: `http://localhost:3000`; Production: `https://biranchikulesika.com`.

---

### `SUPABASE_URL`

1. **Variable name**: `SUPABASE_URL`
2. **What it is**: Supabase project HTTPS API gateway URL.
3. **Why the app needs it**: Connects `@supabase/supabase-js` and `@supabase/ssr` clients to your database and storage buckets.
4. **Where to get it**:
   - Supabase Dashboard (`supabase.com/dashboard`) → Select Project → Project Settings (Gear icon) → **API** → **Project URL**.
5. **Expected format**: `https://<project-ref>.supabase.co`.
6. **Where it is used**:
   - `lib/supabase/server.ts` -> `getSupabaseAdmin()`, `getSupabasePublic()`, `getSupabaseServer()`
   - `app/admin/login/actions.ts`
   - `app/admin/auth/callback/route.ts`
7. **Server vs Client**: **Client-safe** (`NEXT_PUBLIC_` prefix).
8. **Security implications**: Public endpoint. Access is protected by Supabase Row-Level Security (RLS).
9. **Common mistakes**: Pasting the PostgreSQL direct connection string (`postgresql://...`) instead of the HTTPS API URL.
10. **Troubleshooting**: If requests fail with network errors, verify the project is active and not paused in Supabase.
11. **Required**: **Yes**.
12. **Environment behavior**: Points to your production or staging Supabase project.

---

### `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

1. **Variable name**: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
2. **What it is**: Supabase anonymous public API key.
3. **Why the app needs it**: Authorizes client-side and server-side public queries governed by Row-Level Security policies.
4. **Where to get it**:
   - Supabase Dashboard → Project Settings → **API** → Project API keys → **anon / public**.
5. **Expected format**: Long JWT string (`eyJhbGciOi...`) or modern format (`sb_pub_...`).
6. **Where it is used**:
   - `lib/supabase/server.ts` -> `getSupabasePublic()`, `getSupabaseServer()`
   - `app/admin/login/actions.ts`
   - `app/admin/auth/callback/route.ts`
7. **Server vs Client**: **Client-safe** (`NEXT_PUBLIC_` prefix).
8. **Security implications**: Safe to expose in browser code. RLS policies control table access.
9. **Common mistakes**: Pasting the `service_role` secret key into this public variable.
10. **Troubleshooting**: If public queries return `401 Unauthorized`, verify the key has not expired.
11. **Required**: **Yes**.
12. **Environment behavior**: Configured in development (if using live DB) and production.

---

### `SUPABASE_SECRET_KEY`

1. **Variable name**: `SUPABASE_SECRET_KEY`
2. **What it is**: Supabase administrative service-role secret key.
3. **Why the app needs it**: Authorizes `SupabaseContentRepository` to perform administrative queries, bypassing RLS on trusted server execution paths.
4. **Where to get it**:
   - Supabase Dashboard → Project Settings → **API** → Project API keys → **service_role (Secret)**.
5. **Expected format**: Long JWT string (`eyJhbGciOi...`) or modern format (`sb_secret_...`).
6. **Where it is used**:
   - `lib/supabase/server.ts` -> `getSupabaseAdmin()`
7. **Server vs Client**: **SERVER-ONLY (CRITICAL SECRET)**.
8. **Security implications**: **CRITICAL**. This key bypasses all RLS security policies and has full database write access.
   - **NEVER** prefix with `NEXT_PUBLIC_`.
   - **NEVER** import in client components.
   - If leaked, rotate immediately in the Supabase Dashboard.
9. **Common mistakes**: Prefixing with `NEXT_PUBLIC_` or committing to GitHub.
10. **Troubleshooting**: If server actions throw `Missing Supabase configuration`, verify `SUPABASE_SECRET_KEY` is present in server environment variables.
11. **Required**: **Yes**.
12. **Environment behavior**: Server-only across all environments.

---

### `NEXT_PUBLIC_RAZORPAY_KEY_ID`

1. **Variable name**: `NEXT_PUBLIC_RAZORPAY_KEY_ID`
2. **What it is**: Public Razorpay Key ID for client checkout.
3. **Why the app needs it**: Initializes the Razorpay Checkout modal on the `/support` page.
4. **Where to get it**:
   - Razorpay Dashboard (`dashboard.razorpay.com`) → Account & Settings → **API Keys** → Generate/View Key ID.
5. **Expected format**: `rzp_test_xxxxxxxxxxxxxx` (Test) or `rzp_live_xxxxxxxxxxxxxx` (Live).
6. **Where it is used**:
   - `components/support-page.tsx` -> `new Razorpay({ key: razorpayKey, ... })`
7. **Server vs Client**: **Client-safe** (`NEXT_PUBLIC_` prefix).
8. **Security implications**: Public identifier. Cannot capture or refund payments without the secret key.
9. **Common mistakes**: Pasting the Secret Key instead of the Key ID.
10. **Troubleshooting**: If Razorpay modal shows "Invalid Key ID", verify key matches Test/Live mode.
11. **Required**: **Optional** (Falls back to local simulated patronage if missing).
12. **Environment behavior**: `rzp_test_...` for dev/staging; `rzp_live_...` in production.

---

### `RAZORPAY_KEY_SECRET`

1. **Variable name**: `RAZORPAY_KEY_SECRET`
2. **What it is**: Private Razorpay API secret key.
3. **Why the app needs it**: Cryptographically verifies payment signatures (`HMAC-SHA256(order_id + "|" + payment_id)`) on payment confirmations.
4. **Where to get it**:
   - Razorpay Dashboard → Account & Settings → **API Keys** → Key Secret.
5. **Expected format**: 24+ character alphanumeric secret string.
6. **Where it is used**:
   - `lib/razorpay.ts` -> `verifyPaymentSignature()`
   - `lib/services/content.service.ts` -> `confirmPayment()`
7. **Server vs Client**: **SERVER-ONLY (SECRET)**.
8. **Security implications**: Secret. Keep strictly server-side.
9. **Common mistakes**: Exposing in browser code or mixing up Test and Live keys.
10. **Troubleshooting**: If payment confirmation throws "Invalid payment signature", verify `RAZORPAY_KEY_SECRET` matches the active `NEXT_PUBLIC_RAZORPAY_KEY_ID`.
11. **Required**: **Optional** (Required if validating live Razorpay checkout signatures).
12. **Environment behavior**: Test secret in staging; Live secret in production.

---

### `RAZORPAY_WEBHOOK_SECRET`

1. **Variable name**: `RAZORPAY_WEBHOOK_SECRET`
2. **What it is**: Webhook secret token for signature verification.
3. **Why the app needs it**: Validates the `X-Razorpay-Signature` header on POST requests to `/api/webhooks/razorpay`.
4. **Where to get it**:
   - Razorpay Dashboard → Account & Settings → **Webhooks** → Add Webhook (URL: `https://yourdomain.com/api/webhooks/razorpay`) → **Secret** field.
5. **Expected format**: Custom secret string configured during webhook setup.
6. **Where it is used**:
   - `lib/razorpay.ts` -> `verifyWebhookSignature()`
   - `lib/services/content.service.ts` -> `processRazorpayWebhook()`
   - `app/api/webhooks/razorpay/route.ts`
7. **Server vs Client**: **SERVER-ONLY (SECRET)**.
8. **Security implications**: Secret. Prevents attackers from spoofing payment captured webhook events.
9. **Common mistakes**: Pasting the API Key Secret instead of the Webhook Secret.
10. **Troubleshooting**: If webhooks return HTTP 400 "Invalid webhook signature", verify the secret matches Razorpay Webhook settings.
11. **Required**: **Optional** (Required if receiving live Razorpay webhooks).
12. **Environment behavior**: Set in production and local webhook tunnels (e.g. ngrok).

---

### `PEXELS_API_KEY`

1. **Variable name**: `PEXELS_API_KEY`
2. **What it is**: API key for Pexels curated photo search.
3. **Why the app needs it**: Fetches rotating high-resolution atmosphere wallpapers for `/admin/login`.
4. **Where to get it**:
   - Pexels API Portal (`pexels.com/api`) → Sign in → **Your API Key**.
5. **Expected format**: 56-character alphanumeric string.
6. **Where it is used**:
   - `lib/services/pexels.service.ts` -> `fetchFromPexels()`
   - `app/api/login-background/route.ts`
7. **Server vs Client**: **SERVER-ONLY (SECRET)**.
8. **Security implications**: Secret API key. Low blast radius (read-only image search).
9. **Common mistakes**: Forgetting to set header `Authorization: <key>`.
10. **Troubleshooting**: If login wallpaper fails, the app falls back to curated local dark images.
11. **Required**: **Optional** (Falls back to local atmosphere images if unset).
12. **Environment behavior**: Safe to share same key across dev and prod.

---

### `OPENAI_API_KEY` / `GROQ_API_KEY`

1. **Variable name**: `OPENAI_API_KEY` or `GROQ_API_KEY`
2. **What it is**: LLM provider API key for editorial metadata generation.
3. **Why the app needs it**: Powers AI metadata suggestions (persona classification, SEO tags, summary) in the MDX Composer (`/admin/compose`).
4. **Where to get it**:
   - OpenAI: `platform.openai.com/api-keys`
   - Groq: `console.groq.com/keys`
5. **Expected format**: `sk-proj-...` (OpenAI) or `gsk_...` (Groq).
6. **Where it is used**:
   - `lib/services/ai-metadata.service.ts` -> `generateDocumentAiMetadata()`
7. **Server vs Client**: **SERVER-ONLY (SECRET)**.
8. **Security implications**: Secret. Rate limited on the server.
9. **Common mistakes**: Exposing in browser bundles.
10. **Troubleshooting**: If AI suggestions are unavailable, the composer uses local heuristic NLP generation seamlessly.
11. **Required**: **Optional** (Falls back to local NLP heuristics if unset).
12. **Environment behavior**: Optional across all environments.

---

## 3. Feature Relationship Map

```
Supabase PostgreSQL & Storage:
      ├── SUPABASE_URL
      ├── NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ──► getSupabasePublic() / Client Queries (RLS)
      └── SUPABASE_SECRET_KEY                   ──► getSupabaseAdmin()  / Admin Operations (Bypasses RLS)

Patronage Flow:
      ├── NEXT_PUBLIC_RAZORPAY_KEY_ID           ──► Browser Checkout Modal on /support
      ├── RAZORPAY_KEY_SECRET                   ──► Server HMAC Verification in confirmPayment()
      └── RAZORPAY_WEBHOOK_SECRET               ──► Signature Validation on /api/webhooks/razorpay

SEO & Social Sharing:
      └── NEXT_PUBLIC_SITE_URL                  ──► Canonical URLs, Sitemap.xml, Open Graph /api/og
```

---

## 4. Credential Rotation Guidelines

### If `SUPABASE_SECRET_KEY` is Compromised:

1. Go to Supabase Dashboard → Project Settings → **API**.
2. Click **Generate new secret key** next to `service_role`.
3. Update `SUPABASE_SECRET_KEY` immediately in your hosting environment variables.
4. Redeploy the application.

### If `RAZORPAY_KEY_SECRET` is Compromised:

1. Go to Razorpay Dashboard → Account & Settings → **API Keys**.
2. Click **Regenerate Key**.
3. Update `RAZORPAY_KEY_SECRET` in your hosting dashboard and redeploy.

### If `RAZORPAY_WEBHOOK_SECRET` is Compromised:

1. Go to Razorpay Dashboard → Account & Settings → **Webhooks**.
2. Edit the active webhook and generate a new Secret.
3. Update `RAZORPAY_WEBHOOK_SECRET` in hosting settings.
