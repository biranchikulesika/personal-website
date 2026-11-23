import { NextResponse } from 'next/server';
import { getDailyBackground } from '@/lib/services/pexels.service';
import { checkRateLimit, rateLimitKey } from '@/lib/rate-limit';

/**
 * GET /api/login-background
 *
 * Returns the daily background image metadata for the login page.
 * The same image is returned for the entire calendar day.
 * Caches in memory and via Next.js fetch revalidation.
 *
 * Response:
 *   { imageUrl, photographer, photographerUrl, pexelsUrl }
 *
 * If Pexels is unavailable or the API key is missing, returns null.
 */
export async function GET(request: Request) {
  // shortcut: low-stakes read fails open if the shared store is down; no per-instance fallback is used.
  const allowed = await checkRateLimit(
    rateLimitKey(request, 'login-background'),
    30,
    60,
    { failOpen: true }
  );
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  const background = await getDailyBackground();

  if (!background) {
    return NextResponse.json(null);
  }

  return NextResponse.json(background, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
