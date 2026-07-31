import { getPostsMeta } from '@/lib/queries';
import { SITE_URL } from '@/lib/config/seo';

export const dynamic = 'force-dynamic';

/**
 * Sitemap for all published blog posts across all personas.
 * Served at /posts-sitemap.xml as application/xml.
 *
 * Dynamically fetches posts from the database so newly published
 * content appears in the sitemap without a full rebuild.
 *
 * Uses main-domain URLs to match the post page canonical.
 */
export async function GET() {
  const now = new Date().toISOString();

  let entries = '';

  try {
    const posts = await getPostsMeta();
    const publishedPosts = posts.filter(
      (p: any) =>
        p.status !== 'draft' &&
        (!p.status || p.status.toLowerCase() !== 'draft') &&
        p.hidden !== true,
    );

    entries = publishedPosts
      .filter((post: any) => {
        const slug = post.slug || '';
        return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
      })
      .map((post: any) => {
        const slug = post.slug || post.id;
        const lastMod = post.updatedAt
          ? new Date(post.updatedAt).toISOString()
          : now;

        const url = `${SITE_URL}/p/${slug}`;

        const priority = post.featured ? 0.9 : 0.8;

        return `
  <url>
    <loc>${escapeXml(url)}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority.toFixed(1)}</priority>
  </url>`;
      })
      .join('');
  } catch (error) {
    console.error('Posts sitemap: Failed to fetch posts', error);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries || '  <!-- No posts published yet -->'}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

/** Minimal XML escaping to prevent injection from post titles/URLs. */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
