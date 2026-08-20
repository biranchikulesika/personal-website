/**
 * Proxy — route-level security boundary (Next.js 16 convention).
 *
 * This proxy enforces the security boundary between public and admin routes.
 *
 * When AUTH_ENABLED=true and DATA_SOURCE=supabase:
 *   - Admin routes require a valid Supabase session.
 *   - The authenticated user must have content_admin or super_admin role.
 *   - Unauthenticated users are redirected to /admin/login.
 *   - Users with 'user' role are denied access.
 *   - Authenticated users on the login page are redirected to /admin.
 *   - The OAuth callback route is allowed through for session exchange.
 *
 * When auth is disabled (default on this branch):
 *   - All admin routes are accessible without authentication.
 *   - This is intentional for UI development.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Roles that can access the admin panel
const ADMIN_ROLES = new Set(['content_admin', 'super_admin']);

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
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
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
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
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

  // ── Refresh the session ──────────────────────────────────────────────────
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

  // ── Role-based access control ────────────────────────────────────────────
  // Users must have content_admin or super_admin role to access admin.
  if (user) {
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const userRole = roleData?.role;

    if (!userRole || !ADMIN_ROLES.has(userRole)) {
      // User exists but has no admin role — redirect to home.
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/admin/:path*',
  ],
};
