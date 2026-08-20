import { NextResponse } from 'next/server';
import { getDailyBackground } from '@/lib/services/pexels.service';

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
export async function GET() {
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
