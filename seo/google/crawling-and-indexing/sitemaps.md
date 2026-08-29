# Sitemaps

A sitemap tells Google about the pages on your site that you consider important.

## What Google says

### What is a sitemap

A sitemap is a file (usually XML) that lists URLs on your site along with optional metadata (last modified date, change frequency, priority). It helps Google discover and prioritize pages for crawling.

### Key points

- Sitemaps help Google discover pages, especially new or updated ones
- Google prioritizes pages listed in sitemaps for crawling
- Sitemaps are especially important for sites with many pages or pages not linked from elsewhere
- A sitemap doesn't guarantee indexing — it's a discovery aid
- Sitemaps should only list canonical URLs
- Maximum 50,000 URLs per sitemap file (or 50MB uncompressed)

### Format

XML sitemaps use the Sitemap protocol:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2024-01-15</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

### Declare your sitemap

Tell Google about your sitemap in robots.txt:

```
Sitemap: https://example.com/sitemap.xml
```

Or submit it directly in Search Console.

## What this means for this website

### Current implementation (`app/sitemap.ts`)

This site generates a dynamic XML sitemap using Next.js `MetadataRoute.Sitemap`:

```typescript
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const service = new ContentService();
  
  // Static pages with priorities
  const staticPages = [
    { url: SITE_URL, priority: 1.0, changeFrequency: 'weekly' },
    { url: `${SITE_URL}/about`, priority: 0.8, changeFrequency: 'monthly' },
    // ... more static pages
  ];
  
  // Dynamic posts
  const posts = await service.getAllPosts();
  const postPages = posts
    .filter(post => post.status !== 'unpublished')
    .map(post => ({
      url: `${SITE_URL}/p/${post.slug}`,
      lastModified: new Date(post.lastEditedAt || post.publishedAt),
      changeFrequency: 'monthly',
      priority: 0.7,
    }));
  
  // Dynamic notes
  const notes = await service.getAllNotes();
  const notePages = notes
    .filter(note => note.status !== 'unpublished')
    .map(note => ({
      url: `${SITE_URL}/n/${note.slug}`,
      lastModified: new Date(note.date),
      changeFrequency: 'monthly',
      priority: 0.6,
    }));
  
  return [...staticPages, ...postPages, ...notePages];
}
```

### Sitemap content

| URL pattern | Count | Priority | Change frequency |
|-------------|-------|----------|-----------------|
| `/` | 1 | 1.0 | Weekly |
| `/about` | 1 | 0.8 | Monthly |
| `/library` | 1 | 0.8 | Weekly |
| `/scribble` | 1 | 0.9 | Weekly |
| `/now` | 1 | 0.8 | Weekly |
| `/support` | 1 | 0.7 | Monthly |
| `/p/[slug]` | Dynamic | 0.7 | Monthly |
| `/n/[slug]` | Dynamic | 0.6 | Monthly |

### What's excluded

- `/admin/*` routes (not in sitemap, blocked via headers)
- `/api/*` routes (not in sitemap, blocked via robots.txt)
- `/fund` (redirects to `/support`)
- Unpublished content (`status === 'unpublished'`)

## Checklist

- [ ] Sitemap is accessible at `/sitemap.xml`
- [ ] All public content pages are included
- [ ] Only canonical URLs are listed
- [ ] Unpublished content is excluded
- [ ] Admin routes are excluded
- [ ] `lastmod` dates are accurate
- [ ] Sitemap is declared in robots.txt
- [ ] Sitemap is submitted in Search Console

## Source

Google Search Central:
[Sitemaps overview](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview)
[Build a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
