import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/config/seo';

/**
 * Robots.txt configuration.
 * Allows all major search engine and AI crawlers access to public routes.
 * Blocks /admin and /api paths from indexing.
 * Explicitly allows friendly AI crawlers (ChatGPT, Claude, Gemini, Perplexity, etc.)
 * Next.js automatically serves this at /robots.txt.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/admin/login'],
        disallow: ['/admin', '/admin/', '/api', '/api/', '/feed.xml', '/manifest.json', '/_next/static/'],
      },
      // Gift results from AI crawlers that give attribution and follow robots.txt
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: ['/admin', '/api'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: '/',
        disallow: ['/admin', '/api'],
      },
      {
        userAgent: 'Claude-Web',
        allow: '/',
        disallow: ['/admin', '/api'],
      },
      {
        userAgent: 'Google-Extended',
        allow: '/',
        disallow: ['/admin', '/api'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: ['/admin', '/api'],
      },
      {
        userAgent: 'CCBot',
        allow: '/',
        disallow: ['/admin', '/api'],
      },
    ],
    // Sitemap index references two sub-sitemaps:
    //   /pages-sitemap.xml — static routes (main domain + persona subdomains)
    //   /posts-sitemap.xml — dynamic post routes
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
