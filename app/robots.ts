import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/constants';

/**
 * Robots.txt configuration.
 *
 * Public content is crawlable. API routes are disallowed.
 * Admin routes are deliberately NOT listed here: naming them would advertise
 * them. /admin is kept out of indexes by its X-Robots-Tag header
 * (next.config.ts) and by the auth proxy.
 * Sitemap location is declared for crawlers.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/api/og'],
        disallow: ['/api/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
