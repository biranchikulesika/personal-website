import { SITE_URL } from '@/lib/config/seo';

export const dynamic = 'force-dynamic';

const VALID_PERSONAS = ['builder', 'thinker', 'wanderer', 'operator'] as const;
type Persona = (typeof VALID_PERSONAS)[number];
type RouteScope = 'main' | 'all' | 'thinker';

interface RouteDef {
  path: string;
  priority: number;
  freq: string;
  scope: RouteScope;
}

/**
 * Central route definition for all public pages.
 * Each route declares its scope so it automatically maps to the correct
 * set of domains (main only, all personas, or thinker-only extras).
 *
 * When a new page is added to the app, add its route here — the sitemap
 * will pick it up automatically for all applicable domains.
 */
const ALL_PAGES: RouteDef[] = [
  // ── Main-domain-only pages ──────────────────────────────────────
  { path: '/fund', priority: 0.6, freq: 'monthly', scope: 'main' },
  { path: '/terms', priority: 0.3, freq: 'yearly', scope: 'main' },

  // ── Shared pages (main domain + every persona subdomain) ────────
  { path: '', priority: 1.0, freq: 'daily', scope: 'all' },
  { path: '/about', priority: 0.7, freq: 'monthly', scope: 'all' },
  { path: '/blogs', priority: 0.8, freq: 'weekly', scope: 'all' },
  { path: '/blogs/archive', priority: 0.5, freq: 'monthly', scope: 'all' },
  { path: '/newsletter', priority: 0.7, freq: 'monthly', scope: 'all' },

  // ── Thinker-only extra pages ────────────────────────────────────
  { path: '/reading', priority: 0.5, freq: 'monthly', scope: 'thinker' },
];

/** Build an absolute URL for a persona (or main) + path. */
function buildUrl(persona: 'main' | Persona, path: string): string {
  const cleanPath = path === '/' ? '' : path;
  if (persona === 'main') {
    return `${SITE_URL}${cleanPath}`;
  }
  // Subdomain: replace "://" with "://persona." so the host becomes persona.domain
  return SITE_URL.replace('://', `://${persona}.`) + cleanPath;
}

/** Check whether a route definition should be included for the given persona. */
function isIncluded(persona: 'main' | Persona, route: RouteDef): boolean {
  switch (route.scope) {
    case 'main':
      return persona === 'main';
    case 'thinker':
      return persona === 'thinker';
    case 'all':
      return true;
    default:
      return false;
  }
}

/**
 * Sitemap for all static page routes across the main domain and
 * every persona subdomain. Served at /pages-sitemap.xml.
 *
 * Dynamic so newly-added routes (or changed personas) are always
 * reflected. Kept separate from /posts-sitemap.xml to stay well under
 * the 50,000 URL limit.
 */
export async function GET() {
  const now = new Date().toISOString();

  const allPersonas: ('main' | Persona)[] = ['main', ...VALID_PERSONAS];

  const urlElements = allPersonas
    .flatMap((persona) =>
      ALL_PAGES.filter((r) => isIncluded(persona, r)).map((route) => {
        const loc = buildUrl(persona, route.path);
        return [
          '  <url>',
          `    <loc>${loc}</loc>`,
          `    <lastmod>${now}</lastmod>`,
          `    <changefreq>${route.freq}</changefreq>`,
          `    <priority>${route.priority.toFixed(1)}</priority>`,
          '  </url>',
        ].join('\n');
      }),
    )
    .join('\n');

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urlElements,
    '</urlset>',
  ].join('\n');

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
