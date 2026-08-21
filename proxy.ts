/**
 * Proxy — route-level proxy (Next.js 16 convention).
 *
 * Authentication is permanently disabled on this branch.
 * All admin routes are accessible directly without authentication.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default async function proxy(request: NextRequest) {
  // If someone attempts to set AUTH_ENABLED=true in the environment, reject it loudly.
  if (process.env.AUTH_ENABLED === 'true') {
    throw new Error(
      'AUTH_ENABLED=true is not supported. Authentication is permanently disabled on this branch.'
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
  ],
};
