/**
 * Proxy — route-level proxy & authentication guard (Next.js 16 convention).
 *
 * Mandatory authentication guard:
 * - All admin routes (/admin, /admin/compose, etc.) require an active Supabase auth session.
 * - Unauthenticated requests are redirected to /admin/login.
 * - Authenticated users visiting /admin/login are redirected to /admin.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export default async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const pathname = request.nextUrl.pathname;
  const isAuthRoute =
    pathname === '/admin/login' || pathname.startsWith('/admin/auth');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // If Supabase credentials are missing and requesting protected admin route
  if (!supabaseUrl || !supabaseKey) {
    if (!isAuthRoute) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      loginUrl.searchParams.set('error', 'auth_not_configured');
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is authenticated and navigating to login page, redirect to dashboard
  if (user && pathname === '/admin/login') {
    const adminUrl = new URL('/admin', request.url);
    return NextResponse.redirect(adminUrl);
  }

  // If user is unauthenticated and attempting to access a protected admin route, redirect to login
  if (!user && !isAuthRoute) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};
