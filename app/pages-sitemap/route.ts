import { SITE_URL } from '@/lib/config/seo';

export const dynamic = 'force-static';

/**
 * Sitemap for all static pages: main domain routes + persona subdomain routes.
 * Served at /pages-sitemap as application/xml.
 *
 * This is kept separate from the posts sitemap so each stays well under
 * the 50,000 URL limit. For a personal blog, this will always be small.
 */
export async function GET() {
  const now = new Date().toISOString();

  const getSubdomainUrl = (subdomain: string, path: string = '') => {
    const cleanPath = path === '/' ? '' : path;
    return SITE_URL.replace('://', `://${subdomain}.`) + cleanPath;
  };

  // Main domain pages
  const mainRoutes = [
    { path: '', priority: 1.0, freq: 'daily' },
    { path: '/about', priority: 0.7, freq: 'monthly' },
    { path: '/blogs', priority: 0.8, freq: 'weekly' },
    { path: '/blogs/archive', priority: 0.5, freq: 'monthly' },
    { path: '/terms', priority: 0.3, freq: 'yearly' },
    { path: '/fund', priority: 0.6, freq: 'monthly' },
    { path: '/newsletter', priority: 0.7, freq: 'monthly' },
  ];

  // Persona pages (same set for each persona, on their subdomains)
  const personaRoutes = [
    { path: '', priority: 0.8, freq: 'weekly' },
    { path: '/about', priority: 0.6, freq: 'monthly' },
    { path: '/blogs', priority: 0.7, freq: 'weekly' },
    { path: '/blogs/archive', priority: 0.5, freq: 'monthly' },
    { path: '/newsletter', priority: 0.6, freq: 'monthly' },
  ];

  // Thinker has an extra reading page
  const thinkerExtraRoutes = [
    { path: '/reading', priority: 0.5, freq: 'monthly' },
  ];

  const personas = ['builder', 'thinker', 'wanderer', 'operator'] as const;

  const urls = [
    // Main domain
    ...mainRoutes.map(
      (r) => `
  <url>
    <loc>${SITE_URL}${r.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${r.freq}</changefreq>
    <priority>${r.priority.toFixed(1)}</priority>
  </url>`,
    ),

    // Persona subdomains
    ...personas.flatMap((persona) => [
      ...personaRoutes.map(
        (r) => `
  <url>
    <loc>${getSubdomainUrl(persona, r.path)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${r.freq}</changefreq>
    <priority>${r.priority.toFixed(1)}</priority>
  </url>`,
      ),
      // Thinker reading page
      ...(persona === 'thinker'
        ? thinkerExtraRoutes.map(
            (r) => `
  <url>
    <loc>${getSubdomainUrl(persona, r.path)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${r.freq}</changefreq>
    <priority>${r.priority.toFixed(1)}</priority>
  </url>`,
          )
        : []),
    ]),
  ].join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
