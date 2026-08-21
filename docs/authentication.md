# Authentication & Access Control

This document details the authentication and authorization architecture of the platform.

---

## 1. Authentication Architecture

- **Mandatory Admin Protection**: All routes under `/admin` (dashboard, composer, settings) require an authenticated Supabase session.
- **Middleware Guard (`proxy.ts`)**: Automatically checks the user session on incoming requests and redirects unauthenticated visitors to `/admin/login`.
- **Server Component Defense-in-Depth**: Admin page server components (`app/admin/page.tsx`, `app/admin/compose/page.tsx`) perform server-side `getUser()` checks and redirect unauthenticated requests before rendering.

---

## 2. Target Production Auth Architecture

In a production environment connected to Supabase (`DATA_SOURCE="supabase"`):

```
┌─────────────────────────────────────────────────────────────┐
│                 Client (Browser / Login UI)                 │
│              app/admin/login/page.tsx (OAuth/Passkey)       │
└──────────────────────────────┬──────────────────────────────┘
                               │ Authenticates
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                        Supabase Auth                        │
│             (Google, GitHub, WebAuthn / Passkeys)           │
└──────────────────────────────┬──────────────────────────────┘
                               │ Sets HTTP-only cookies
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              Next.js Server Session (@supabase/ssr)         │
│             lib/supabase/server.ts -> getSupabaseServer()   │
└──────────────────────────────┬──────────────────────────────┘
                               │ Resolves user ID
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   Role-Based Authorization                  │
│                     (public.user_roles)                     │
│               - user: Read only                             │
│               - content_admin: Create/Edit/Publish content  │
│               - super_admin: Full system control            │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Key Components

### 1. Supabase Client Configurations (`lib/supabase/server.ts`)

- **`getSupabaseAdmin()`**:
  - Uses `SUPABASE_SECRET_KEY` (service-role key).
  - Bypasses RLS.
  - **SERVER-SIDE ONLY**. Never imported or bundled into client components.
- **`getSupabasePublic()`**:
  - Uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
  - Respects RLS policies. Safe for browser usage.
- **`getSupabaseServer()`**:
  - Uses `@supabase/ssr` with Next.js `cookies()`.
  - Reads and writes user session tokens securely in HTTP-only cookies.

### 2. Role-Based Access Control (RBAC)

User permissions are managed in the `public.user_roles` database table:

```typescript
export type AppRole = "user" | "content_admin" | "super_admin";

export interface UserRole {
  userId: string;
  role: AppRole;
}
```

- When an authenticated user accesses admin features, the system queries `getUserRole(userId)` from `ContentService`.
- If the user role is not `content_admin` or `super_admin`, write actions and administrative views are rejected.

---

## 4. Security Rules & Best Practices

1. **Never Hardcode Secrets**:
   - `SUPABASE_SECRET_KEY`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` must only exist in `.env.local` or host environment variables.
2. **Never Expose Admin Routes in Public Metadata**:
   - Admin paths (`/admin`, `/admin/login`, `/admin/compose`) must never appear in `sitemap.xml`, `robots.txt`, or public links.
   - Admin layouts enforce `X-Robots-Tag: noindex, nofollow` and `robots: { index: false, follow: false }`.
3. **Session Cookie Isolation**:
   - Authentication tokens are handled exclusively via HTTP-only, SameSite, Secure cookies managed by `@supabase/ssr`.
