/**
 * Proxy — route-level security boundary (Next.js 16 convention).
 *
 * This proxy enforces the security boundary between public and admin routes.
 *
 * When AUTH_ENABLED=true and DATA_SOURCE=supabase:
 *   - Admin routes require a valid Supabase session.
 *   - Unauthenticated users are redirected to /admin/login.
 *   - Authenticated users on the login page are redirected to /admin.
 *   - The OAuth callback route is allowed through for session exchange.
 *
 * When auth is disabled (default on this branch):
 *   - All admin routes are accessible without authentication.
 *   - This is intentional for UI development.
 *
 * Legacy reference: See `legacy/lib/supabase/middleware.ts` for the session
 * refresh pattern used in the previous implementation.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect admin routes.
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // When auth is disabled, allow all admin routes through.
  const authEnabled = process.env.AUTH_ENABLED === 'true';
  if (!authEnabled) {
    return NextResponse.next();
  }

  // ── Supabase session verification ────────────────────────────────────────
  // Create a response we can modify (to set/update auth cookies).
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    // Supabase not configured — deny access to admin routes.
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Write cookies to the request (for downstream server components).
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        // Recreate the response so it carries the updated request.
        supabaseResponse = NextResponse.next({ request });
        // Write cookies to the response (for the browser).
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // ── Allow auth callback through without session check ────────────────────
  if (pathname.startsWith('/admin/auth/callback')) {
    return supabaseResponse;
  }

  // ── Refresh the session (important for SSR cookie-based auth) ────────────
  // This call ensures the session cookie is refreshed if the token is about
  // to expire. Without this, sessions would silently expire.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginRoute = pathname.startsWith('/admin/login');

  // Redirect unauthenticated users to login.
  if (!user && !isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from the login page.
  if (user && isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Match admin routes but exclude static assets and Next.js internals.
    '/admin/:path*',
  ],
};
