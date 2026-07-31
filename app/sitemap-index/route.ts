import { SITE_URL } from '@/lib/config/seo';

export const dynamic = 'force-static';

/**
 * Sitemap index — links to the two sub-sitemaps (pages + posts).
 * Served at /sitemap-index as application/xml.
 *
 * This keeps each individual sitemap well under the 50,000 URL limit
 * required by the sitemaps.org protocol.
 *
 * Updated in robots.ts at /robots.txt as the primary sitemap URL.
 */
export async function GET() {
  const now = new Date().toISOString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_URL}/pages-sitemap</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/posts-sitemap</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
