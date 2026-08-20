import type { MetadataRoute } from 'next';
import { ContentService } from '@/lib/services/content.service';
import { SITE_URL } from '@/lib/constants';

/**
 * Dynamic sitemap generation.
 *
 * Includes:
 * - Static public pages (/, /about, /library, /scribble, /support)
 * - Published blog posts (/p/[slug])
 * - Published notes (/n/[slug])
 *
 * Excludes:
 * - Admin routes (/admin)
 * - Now page (force-dynamic, personal)
 * - Support page (not primary content)
 * - Fund page (not primary content)
 * - Error pages
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const service = new ContentService();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/library`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/scribble`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ];

  // Published blog posts
  const posts = await service.getAllPosts();
  const postPages: MetadataRoute.Sitemap = posts
    .filter((post) => post.status !== 'unpublished')
    .map((post) => ({
      url: `${SITE_URL}/p/${post.slug}`,
      lastModified: new Date(post.lastEditedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));

  // Published notes
  const notes = await service.getAllNotes();
  const notePages: MetadataRoute.Sitemap = notes
    .filter((note) => note.status !== 'unpublished')
    .map((note) => ({
      url: `${SITE_URL}/n/${note.slug}`,
      lastModified: new Date(note.date),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));

  return [...staticPages, ...postPages, ...notePages];
}
