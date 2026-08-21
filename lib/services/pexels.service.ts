/**
 * Daily Pexels Background Service
 *
 * Fetches a landscape photograph from the Pexels API and returns the same
 * image for the entire calendar day. Results are cached in memory so
 * repeated requests within the same day never hit the API again.
 *
 * The Pexels API key must be set in PEXELS_API_KEY (server-side only).
 */

// ── Types ──────────────────────────────────────────────────────────────────

export interface DailyBackground {
  imageUrl: string;
  photographer: string;
  photographerUrl: string;
  pexelsUrl: string;
}

interface PexelsPhoto {
  id: number;
  alt: string | null;
  src: { large2x: string; large: string; original: string };
  photographer: string;
  photographer_url: string;
  url: string;
}

interface PexelsSearchResponse {
  photos: PexelsPhoto[];
  total_results: number;
}

// ── Cache ──────────────────────────────────────────────────────────────────

let cachedDate: string | null = null;
let cachedResult: DailyBackground | null = null;

// ── Queries — varied daily to provide visual diversity ──────────────────────
// Each day picks a query by index (dayOfYear % queries.length).

const QUERIES = [
  'architecture minimal',
  'mountain landscape',
  'ocean horizon',
  'forest mist',
  'city lights night',
  'desert dunes',
  'road through trees',
  'abstract light',
  'rain on glass',
  'starry sky',
  'autumn leaves',
  'fog over lake',
  'geometric buildings',
  'coastal cliffs',
  'snow peak',
  'tropical palm',
  'vintage street',
  'cloud patterns',
  'wildflower meadow',
  'northern lights',
  'rock formations',
  'sunset pier',
  'bamboo forest',
  'urban skyline',
  'peaceful garden',
  'waterfall cascade',
  'sand dunes golden',
  'storm clouds dramatic',
  'quiet harbor',
  'volcanic landscape',
  'canyon depth',
  'ice formation',
  'ancient ruins',
  'cherry blossom',
  'moonlit sea',
  'rolling hills',
  'lighthouse coast',
  'red rock canyon',
  'lavender field',
  'glacier blue',
  'treetop canopy',
  'winding river',
  'pier sunset',
  'wilderness trail',
  'floating dock',
  'misty valley',
  'cactus garden',
  'golden hour field',
  'cobblestone street',
  'mountain reflection',
];

// ── Helpers ────────────────────────────────────────────────────────────────

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function selectQuery(): string {
  const day = getDayOfYear();
  return QUERIES[day % QUERIES.length];
}

// ── API ────────────────────────────────────────────────────────────────────

const PEXELS_BASE = 'https://api.pexels.com/v1/search';

async function fetchFromPexels(query: string): Promise<DailyBackground> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    throw new Error('PEXELS_API_KEY is not set');
  }

  const params = new URLSearchParams({
    query,
    per_page: '10',
    orientation: 'landscape',
    size: 'large',
  });

  const res = await fetch(`${PEXELS_BASE}?${params}`, {
    headers: { Authorization: apiKey },
    next: { revalidate: 86400 }, // cache for 24 hours
  });

  if (!res.ok) {
    throw new Error(`Pexels API error: ${res.status}`);
  }

  const data: PexelsSearchResponse = await res.json();

  if (!data.photos || data.photos.length === 0) {
    throw new Error('No photos returned from Pexels');
  }

  // Use the day to pick a consistent photo from the results
  const day = getDayOfYear();
  const photo = data.photos[day % data.photos.length];

  return {
    imageUrl: photo.src.large2x || photo.src.large || photo.src.original,
    photographer: photo.photographer,
    photographerUrl: photo.photographer_url,
    pexelsUrl: photo.url,
  };
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Get today's background image. Returns the same result for the entire
 * calendar day. Caches in memory so repeated calls are free.
 *
 * Falls back gracefully if the API key is missing or the request fails.
 */
export async function getDailyBackground(): Promise<DailyBackground | null> {
  const today = getTodayString();

  // Return cached if still today
  if (cachedDate === today && cachedResult) {
    return cachedResult;
  }

  try {
    const query = selectQuery();
    const result = await fetchFromPexels(query);

    // Cache for today
    cachedDate = today;
    cachedResult = result;

    return result;
  } catch {
    // Pexels unavailable — return null so the caller can use a fallback
    return null;
  }
}
