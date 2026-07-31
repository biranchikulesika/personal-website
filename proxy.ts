import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * ISR revalidation window (in seconds).
 * Must match the `export const revalidate = 3600` on ISR pages.
 */
const ISR_REVALIDATE_SECONDS = 3600;

/**
 * Routes that use ISR with `revalidate = 3600`.
 * These get stale-while-revalidate CDN headers and ETag-based 304 support.
 */
const ISR_ROUTE_PREFIXES = new Set([
  '/blogs',
  '/newsletter',
  '/thinker/reading',
]);

function isISRRoute(pathname: string): boolean {
  if (ISR_ROUTE_PREFIXES.has(pathname)) return true;
  if (pathname.startsWith('/p/')) return true;
  return false;
}

/**
 * Compute a deterministic ETag for a pathname.
 * The ETag changes every `ISR_REVALIDATE_SECONDS` window, matching the ISR
 * revalidation cadence. Within each window the same path always produces the
 * same ETag, allowing the browser/CDN to send `If-None-Match` on repeat
 * visits for the same content.
 *
 * This is a last-modified-time-window approach: it costs zero I/O (no DB
 * query in the hot path) and is correct for the common case where content
 * updates are infrequent relative to the 1-hour window.
 */
function etagForPath(pathname: string): string {
  const windowIndex = Math.floor(
    Date.now() / (ISR_REVALIDATE_SECONDS * 1000)
  );
  // djb2-style hash of pathname + window
  let hash = 5381;
  const str = `${pathname}-${windowIndex}`;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return `"${Math.abs(hash).toString(36)}"`;
}

/**
 * Align Last-Modified to the start of the current revalidation window.
 * Within the same 1-hour window every response carries the same timestamp,
 * so a browser that sends `If-Modified-Since` will get a correct 304.
 */
function windowStartUTC(): string {
  const now = Date.now();
  const start =
    Math.floor(now / (ISR_REVALIDATE_SECONDS * 1000)) *
    ISR_REVALIDATE_SECONDS *
    1000;
  return new Date(start).toUTCString();
}

/**
 * Cache-Control value for ISR pages.
 *
 *   public                     – cacheable by CDNs / shared caches
 *   max-age=0                  – browser marks as immediately stale (revalidates on every visit)
 *   s-maxage=60                – CDN caches fresh for 60 seconds
 *   stale-while-revalidate=3600 – for the next hour the CDN may serve stale while revalidating
 */
const CACHE_CONTROL_ISR = `public, max-age=0, s-maxage=60, stale-while-revalidate=${ISR_REVALIDATE_SECONDS}`;

/**
 * Log a structured cache event to stdout for observability.
 * Each line is a JSON object consumable by log aggregators.
 * Only fires for ISR routes that pass through `applyISRCache`.
 *
 * Fields:
 *   ts        – ISO-8601 timestamp
 *   path      – the URL pathname being served
 *   status    – 304 for cache hit, 200 for cache miss
 *   etag      – the ETag assigned to this response
 *   ifNoneMatch – the `If-None-Match` header sent by the client (if any)
 *   cache     – the Cache-Control policy applied
 */
/**
 * Log a structured cache event to stdout for observability.
 * Each line is a JSON object consumable by log aggregators.
 * Only fires for ISR routes that pass through `applyISRCache`.
 */
function logCacheEvent(event: {
  host: string;
  path: string;
  status: number;
  etag: string;
  ifNoneMatch: string | null;
}) {
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      type: 'cache',
      host: event.host,
      path: event.path,
      status: event.status,
      hit: event.status === 304,
      etag: event.etag,
      ifNoneMatch: event.ifNoneMatch,
      cache: CACHE_CONTROL_ISR,
    })
  );
}

/**
 * Apply ISR-compatible caching headers to a response and handle 304 Not
 * Modified when the client already holds a matching ETag.
 *
 * Logs cache-hit/miss metrics to stdout for observability.
 *
 * Returns the original response (with headers attached), or a new 304
 * response if the client's `If-None-Match` matches the current window.
 */
function applyISRCache(
  response: NextResponse,
  pathname: string,
  hostname: string,
  request: NextRequest
): NextResponse {
  if (!isISRRoute(pathname)) return response;

  const etag = etagForPath(pathname);
  const ifNoneMatch = request.headers.get('if-none-match');

  // 304 Not Modified — ETag matches current time window
  if (ifNoneMatch === etag || ifNoneMatch === '*') {
    logCacheEvent({
      host: hostname,
      path: pathname,
      status: 304,
      etag,
      ifNoneMatch,
    });

    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: etag,
        'Cache-Control': CACHE_CONTROL_ISR,
        'Last-Modified': windowStartUTC(),
      },
    });
  }

  // Attach caching headers so CDNs and browsers can cache/validate
  response.headers.set('Cache-Control', CACHE_CONTROL_ISR);
  response.headers.set('ETag', etag);
  response.headers.set('Last-Modified', windowStartUTC());

  logCacheEvent({
    host: hostname,
    path: pathname,
    status: 200,
    etag,
    ifNoneMatch,
  });

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

// Static routes that don't need middleware processing (SSG, sitemaps, feeds, robots)
const STATIC_ROUTES = new Set(['/pages-sitemap', '/sitemap-index', '/robots.txt', '/feed.xml']);

export default async function proxy(req: NextRequest) {
  const url = req.nextUrl;

  // Skip middleware for known static routes — they are pre-rendered and served from CDN
  if (STATIC_ROUTES.has(url.pathname)) {
    return NextResponse.next();
  }

  // Get hostname of request (e.g. builder.biranchikulesika.com)
  // In local development, this could be localhost:3000
  let hostname = req.headers.get('host') || 'biranchikulesika.com';

  // Remove port if present
  hostname = hostname.split(':')[0];

  // Dynamically map subdomains based on hostname prefix to sustain robustness
  let mappedPath: string | undefined = undefined;
  if (hostname.startsWith('builder.')) {
    mappedPath = '/builder';
  } else if (hostname.startsWith('operator.')) {
    mappedPath = '/operator';
  } else if (hostname.startsWith('wanderer.')) {
    mappedPath = '/wanderer';
  } else if (hostname.startsWith('thinker.')) {
    mappedPath = '/thinker';
  }

  // Check if space points to static asset or bypass routes (/p/, /admin)
  const isFileRequest = url.pathname.includes('.');
  const isBypassPath =
    url.pathname === '/admin' ||
    url.pathname.startsWith('/admin/') ||
    isFileRequest;

  // For post pages on persona subdomains, pass persona via searchParams
  // instead of relying on headers() which would defeat ISR caching
  if (mappedPath && url.pathname.startsWith('/p/')) {
    url.searchParams.set('persona', mappedPath.replace('/', ''));
    return applyISRCache(NextResponse.rewrite(url), url.pathname, hostname, req);
  }

  // Protect Admin Dashboard Routes
  if (url.pathname === '/admin' || url.pathname.startsWith('/admin/')) {
    return await updateSession(req);
  }

  // Prevent direct access to persona directories in the URL path.
  // Only block when subdomains are active — without them the site's own
  // links point to path-based URLs (/thinker/about) and must be allowed.
  const useSubdomains = process.env.NEXT_PUBLIC_USE_SUBDOMAINS === 'true';
  const isDirectPersonaPath =
    url.pathname === '/builder' ||
    url.pathname.startsWith('/builder/') ||
    url.pathname === '/operator' ||
    url.pathname.startsWith('/operator/') ||
    url.pathname === '/wanderer' ||
    url.pathname.startsWith('/wanderer/') ||
    url.pathname === '/thinker' ||
    url.pathname.startsWith('/thinker/');

  if (isDirectPersonaPath) {
    // Allow direct path access in development or when subdomains are not enabled
    if (process.env.NODE_ENV === 'development' || !useSubdomains) {
      return applyISRCache(NextResponse.next(), url.pathname, hostname, req);
    }

    // Rewrite to a non-existent path to trigger a 404
    // If we're on a persona subdomain, rewrite to a non-existent path within
    // that persona so it uses the persona's 404
    if (mappedPath) {
      return NextResponse.rewrite(
        new URL(`${mappedPath}/404-not-found-blocked`, req.url)
      );
    }
    return NextResponse.rewrite(
      new URL('/404-not-found-blocked', req.url)
    );
  }

  // If a subdomain is matched and path is not a bypass path, rewrite the URL
  // to that specific path directory. We avoid rewriting if the URL already
  // starts with that path to avoid infinite loops.
  if (mappedPath && !isBypassPath) {
    // We rewrite the URL to /subdomain_path/original_path
    // E.g., builder.biranchi.../about -> /builder/about
    const rewrittenUrl = new URL(`${mappedPath}${url.pathname}`, req.url);
    return applyISRCache(NextResponse.rewrite(rewrittenUrl), url.pathname, hostname, req);
  }

  // Default: pass through (main domain, non-ISR routes go here)
  return applyISRCache(NextResponse.next(), url.pathname, hostname, req);
}
