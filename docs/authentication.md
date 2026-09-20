# Authentication and Access Control

This document explains the authentication and authorization architecture of the application.

---

## 1. Authentication Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                 Client Browser / Login Page                 │
│              app/admin/login/page.tsx                       │
│        (OAuth: Google/GitHub, Passkeys / WebAuthn, OTP)     │
└──────────────────────────────┬──────────────────────────────┘
                               │ Authenticates
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                        Supabase Auth                        │
│               - Issues JWTs and refresh tokens              │
│               - Sets secure HTTP-only session cookies       │
└──────────────────────────────┬──────────────────────────────┘
                               │ Next.js request
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Proxy Guard (proxy.ts)                      │
│             - Intercepts /admin and /admin/:path*           │
│             - Checks supabase.auth.getUser()                │
│             - Verifies role in public.user_roles            │
└──────────────────────────────┬──────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
       [ Valid Admin Role ]            [ Unauthorized / User ]
               │                               │
               ▼                               ▼
      Allow access to /admin            Sign out immediately and
                                        redirect to /admin/login
```

---

## 2. Route Guard (`proxy.ts`)

Next.js route proxy runs on all admin routes (`matcher: ["/admin", "/admin/:path*"]`):

1. **Unauthenticated Visitors**:
   If a visitor without an active session requests a protected admin route, the proxy redirects them to `/admin/login?next=<path>`.

2. **Non-Admin Authenticated Users**:
   If a user authenticates but holds only the `user` role (not `content_admin` or `super_admin`):
   - The proxy calls `supabase.auth.signOut()`.
   - Clears session cookies on the redirect response.
   - Redirects to `/admin/login?error=forbidden`.
   This ensures non-admin users cannot maintain an active session against the admin portal.

3. **Admins Visiting Login**:
   If an authenticated admin visits `/admin/login`, the proxy redirects them directly to the `/admin` dashboard.

---

## 3. Defense-in-Depth Layering

Security is not left to the proxy alone:

1. **Server Components**:
   Admin pages (`app/admin/page.tsx`, `app/admin/compose/page.tsx`) check session validity using `getSupabaseServer()` before rendering any administrative data.

2. **Server Actions (`app/admin/actions.ts`)**:
   Every administrative mutation calls `assertAdminUser()`:
   ```typescript
   async function assertAdminUser() {
     const supabase = await getSupabaseServer();
     const { data: { user }, error } = await supabase.auth.getUser();
     if (error || !user) {
       throw new Error('Unauthorized: Administrative authentication required');
     }
     const role = await contentService.getUserRole(user.id);
     if (!isAdminRole(role)) {
       throw new Error('Forbidden: Administrative privileges required');
     }
     return { user, role };
   }
   ```

3. **OAuth Callback Guard (`app/admin/auth/callback/route.ts`)**:
   When exchanging an OAuth code for a session, the callback handler checks the user's assigned role in `public.user_roles`. If the user is not an admin, the handler immediately revokes the session and redirects to `/admin/login?error=forbidden`.

---

## 4. Supported Authentication Methods

### 1. OAuth Providers
- **Google and GitHub**: Users authenticate using OAuth through Supabase Auth.
- Account management in `/admin` allows linking and unlinking additional providers via `connectProviderAction` and `disconnectProviderAction`.

### 2. WebAuthn Passkeys
- Passkeys allow passwordless authentication using device biometrics (Touch ID, Face ID, Windows Hello, or hardware security keys).
- **Library**: Implemented using `@simplewebauthn/server` and `@simplewebauthn/browser`.
- **Challenge Security**:
  - The server generates a random challenge and signs it using an HMAC-SHA256 signature (`lib/auth/webauthn.ts`).
  - The signed challenge is set in a secure, HTTP-only cookie named `__passkey_challenge` with a 5-minute time-to-live.
  - During verification, the challenge is consumed and immediately cleared to prevent replay attacks.
  - Signatures are verified using `crypto.timingSafeEqual`.

### 3. Email OTP
- Supabase email one-time passcodes for direct login.

---

## 5. Role-Based Access Control (RBAC)

User permissions are stored in `public.user_roles`:

```typescript
export type AppRole = 'user' | 'content_admin' | 'super_admin';

export function isAdminRole(role: string | null | undefined): role is 'super_admin' | 'content_admin' {
  return role === 'super_admin' || role === 'content_admin';
}
```

- **`user`**: Default role for visitors. No access to `/admin` or administrative server actions.
- **`content_admin`**: Can create, edit, publish, and delete posts, notes, books, now entries, and media.
- **`super_admin`**: Full administrative access, including managing roles and sessions.

---

## 6. Security Boundaries and Rules

1. **No Admin Route Leakage**:
   Admin routes must never be linked in public navigation, footer, `sitemap.xml`, or `robots.txt`.
2. **Server-Side Key Isolation**:
   `SUPABASE_SERVICE_ROLE_KEY` and `RAZORPAY_KEY_SECRET` must never use the `NEXT_PUBLIC_` prefix and must never be imported into client components.
3. **Session Cookie Isolation**:
   Session cookies use `httpOnly: true`, `sameSite: 'lax'`, and `secure: true` in production.
