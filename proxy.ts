/**
 * Proxy: route-level proxy & authentication guard (Next.js 16 convention).
 *
 * Mandatory authentication + authorization guard:
 * - All admin routes (/admin, /admin/compose, etc.) require an active Supabase auth session.
 * - Only users with the `content_admin` or `super_admin` role may access admin routes.
 * - Unauthenticated requests are redirected to /admin/login.
 * - Authenticated non-admin users are redirected to /admin/login?error=forbidden.
 * - Authenticated admins visiting /admin/login are redirected to /admin.
 */

import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSupabaseUrl, getSupabasePublishableKey } from "@/lib/config/env";
import { isAdminRole } from "@/lib/auth/admin";

export default async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const pathname = request.nextUrl.pathname;
  const isAuthRoute =
    pathname === "/admin/login" || pathname.startsWith("/admin/auth");

  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabasePublishableKey();

  // If Supabase credentials are missing and requesting protected admin route
  if (!supabaseUrl || !supabaseKey) {
    if (!isAuthRoute) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      loginUrl.searchParams.set("error", "auth_not_configured");
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

  // Resolve the caller's role. Uses the user's own session cookies so RLS
  // ('users_read_own_role') confines the lookup to their own row.
  if (user) {
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();
    const isAdmin = isAdminRole(roleRow?.role);

    // Admin visiting login page -> go to dashboard
    if (pathname === "/admin/login" && isAdmin) {
      const adminUrl = new URL("/admin", request.url);
      return NextResponse.redirect(adminUrl);
    }

    // Any authenticated user who is not an admin is signed out immediately
    // (both on protected routes and on the login page) so no unauthorized session
    // survives. The auth callback (code exchange) is the one exception.
    if (!isAdmin && !pathname.startsWith("/admin/auth")) {
      try {
        await supabase.auth.signOut();
      } catch {
        // Sign-out is best-effort; the redirect still clears the session below.
      }

      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("error", "forbidden");
      const redirectResponse = NextResponse.redirect(loginUrl);

      // signOut cleared the auth cookies on the internal `response`; carry
      // those cleared cookies over to the redirect so the session really dies.
      response.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value, {
          path: cookie.path,
          httpOnly: cookie.httpOnly,
          secure: cookie.secure,
          sameSite: cookie.sameSite,
          expires: cookie.expires,
          domain: cookie.domain,
        });
      });

      return redirectResponse;
    }

    return response;
  }

  // If user is unauthenticated and attempting to access a protected admin route, redirect to login
  if (!isAuthRoute) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
