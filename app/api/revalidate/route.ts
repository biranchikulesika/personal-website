import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

/**
 * POST /api/revalidate — Revalidate ISR cache for given paths.
 *
 * Purpose: Trigger on-demand ISR revalidation when content is published,
 * updated, or deleted. Used by the admin panel and external webhooks.
 *
 * Authentication: Requires a secret token passed via:
 *   - `secret` in the JSON body
 *   - OR `x-revalidation-secret` request header
 *
 * The secret must match `REVALIDATION_SECRET` (env var), with a fallback
 * to `CRON_SECRET` for backward compatibility.
 *
 * Request body (JSON):
 *   secret  (string)  – Authentication token
 *   path    (string)  – URL path to revalidate, e.g. "/p/my-post" or "/blogs"
 *   persona (string)  – Optional. If set, also revalidates "/{persona}/blogs"
 *                        (useful for persona-specific blog listings)
 *
 * Example:
 *   curl -X POST /api/revalidate \
 *     -H "Content-Type: application/json" \
 *     -d '{"secret":"xxx","path":"/p/my-post","persona":"wanderer"}'
 */
export async function POST(request: Request) {
  // Parse body; fall back to empty object on parse failure
  let body: { secret?: string; path?: string; persona?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body.' },
      { status: 400 }
    );
  }

  // Check secret from body first, then from header
  const secret =
    body.secret || request.headers.get('x-revalidation-secret') || '';

  const expectedSecret =
    process.env.REVALIDATION_SECRET || process.env.CRON_SECRET || '';

  if (!expectedSecret) {
    console.error(
      '[revalidate] REVALIDATION_SECRET / CRON_SECRET is not configured.'
    );
    return NextResponse.json(
      { error: 'Revalidation secret not configured on server.' },
      { status: 500 }
    );
  }

  if (secret !== expectedSecret) {
    return NextResponse.json({ error: 'Invalid secret.' }, { status: 401 });
  }

  const { path, persona } = body;

  if (!path) {
    return NextResponse.json(
      { error: 'Missing required field: path' },
      { status: 400 }
    );
  }

  // ── Revalidate paths ───────────────────────────────────────────────
  const pathsToRevalidate: string[] = [path];

  // If the path is a post page, also revalidate blog listings
  if (path.startsWith('/p/')) {
    pathsToRevalidate.push('/blogs');
    pathsToRevalidate.push('/');

    if (persona) {
      // Revalidate the persona-specific blog listing
      // (the proxy rewrites /{persona}/blogs so these are internal paths)
      pathsToRevalidate.push(`/${persona}/blogs`);
    }
  }

  // If the path is a blog listing, also revalidate the homepage
  if (path === '/blogs') {
    pathsToRevalidate.push('/');
  }

  // Always revalidate sitemap since it includes published dates
  pathsToRevalidate.push('/sitemap.xml');

  const results: { path: string; revalidated: boolean }[] = [];

  for (const p of pathsToRevalidate) {
    try {
      // Use 'layout' type for sitemap (route handler), 'page' for everything else
      const type = p === '/sitemap.xml' ? 'layout' : 'page';
      revalidatePath(p, type as 'page' | 'layout');
      results.push({ path: p, revalidated: true });
    } catch (error) {
      console.error(`[revalidate] Failed to revalidate path "${p}":`, error);
      results.push({ path: p, revalidated: false });
    }
  }

  const allSucceeded = results.every((r) => r.revalidated);

  return NextResponse.json(
    {
      revalidated: allSucceeded,
      results,
      timestamp: new Date().toISOString(),
    },
    { status: allSucceeded ? 200 : 207 }
  );
}
