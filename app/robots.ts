import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/constants';

/**
 * Robots.txt configuration.
 *
 * Public content is crawlable.
 * Admin routes are explicitly disallowed.
 * Sitemap location is declared for crawlers.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
