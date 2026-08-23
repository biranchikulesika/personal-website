import type { MetadataRoute } from 'next';
import { ContentService } from '@/lib/services/content.service';
import { SITE_URL } from '@/lib/constants';

/**
 * Dynamic sitemap generation.
 *
 * Includes:
 * - Static public pages (/, /about, /library, /scribble, /support, /now)
 * - Published blog posts (/p/[slug])
 * - Published notes (/n/[slug])
 *
 * Excludes:
 * - Admin routes (/admin)
 * - Fund page (not primary content)
 * - Error pages
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const service = new ContentService();

  // Static public pages
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
    {
      url: `${SITE_URL}/now`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/support`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  // Published blog posts (dynamic)
  const posts = await service.getAllPosts();
  const postPages: MetadataRoute.Sitemap = posts
    .filter((post) => post.status !== 'unpublished')
    .map((post) => {
      const dateStr = post.lastEditedAt || post.publishedAt;
      const parsedDate = dateStr ? new Date(dateStr) : new Date();
      const lastModified = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

      return {
        url: `${SITE_URL}/p/${post.slug}`,
        lastModified,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      };
    });

  // Published notes (dynamic)
  const notes = await service.getAllNotes();
  const notePages: MetadataRoute.Sitemap = notes
    .filter((note) => note.status !== 'unpublished')
    .map((note) => {
      const parsedDate = note.date ? new Date(note.date) : new Date();
      const lastModified = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

      return {
        url: `${SITE_URL}/n/${note.slug}`,
        lastModified,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      };
    });

  return [...staticPages, ...postPages, ...notePages];
}
