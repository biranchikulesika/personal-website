# Open Graph and Social Media Meta Tags

Open Graph (OG) and Twitter Card meta tags control how your pages appear when shared on social media platforms.

## What Google says

Google doesn't directly use Open Graph tags for ranking. However:

- OG tags control social media previews (Facebook, LinkedIn, Twitter/X)
- Google may use `og:title` as a signal for title link generation
- `og:site_name` helps Google understand your site name
- Well-configured social previews drive referral traffic, which can indirectly benefit SEO

## What this means for this website

### Current implementation

Every page includes both Open Graph and Twitter Card metadata.

**Root metadata** (`lib/seo.ts`):
```typescript
openGraph: {
  type: 'website',
  locale: 'en_US',
  siteName: SITE_NAME,
  images: [{ url: ogImage({ ... }), width: 1200, height: 630 }],
},
twitter: {
  card: 'summary_large_image',
  creator: '@BKulesika',
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  images: [ogImage({ ... })],
},
```

**Content pages** override with page-specific data:
```typescript
openGraph: {
  type: 'article',
  title: post.title,
  description: post.description,
  url: `${SITE_URL}/p/${post.slug}`,
  publishedTime: post.publishedAt,
  modifiedTime: post.lastEditedAt,
  tags: post.tags,
  images: [{ url: ogUrl, width: 1200, height: 630 }],
},
```

### OG images

OG images are dynamically generated via `/api/og` for every page. They use `ImageResponse` from Next.js and are served as PNG at 1200×630 pixels.

**Image generation by page type:**

| Page type | OG image | Description |
|-----------|----------|-------------|
| Home | `?type=home` | Hero layout with photo |
| About | `?type=about` | Photo mosaic |
| Library | `?type=library` | Book covers |
| Scribble | `?type=scribble` | Card composition |
| Now | `?type=now` | Latest entry |
| Support | `?type=support` | Patronage message |
| Post | `?slug=xxx` | Dynamic with cover image |
| Note | `?slug=xxx&type=note` | Dynamic with cover image |

### Caching

OG images are cached for 24 hours with `stale-while-revalidate` for 7 days. This ensures fast loading for social media crawlers while keeping content reasonably fresh.

### CORS

OG images are served with `Access-Control-Allow-Origin: *` so social media crawlers (Twitter, Facebook, LinkedIn) can fetch them from any origin.

## Checklist

- [ ] Every page has Open Graph metadata
- [ ] Every page has Twitter Card metadata
- [ ] OG images are 1200×630 pixels
- [ ] OG type is set correctly (`website` for pages, `article` for posts)
- [ ] Twitter card type is `summary_large_image`
- [ ] Twitter creator handle is set (`@BKulesika`)
- [ ] OG images are unique per page
- [ ] Social preview images load correctly

## Source

Google Search Central doesn't have dedicated OG documentation, but the tag source references:
[Open Graph protocol](https://ogp.me/)
[Twitter Card documentation](https://developer.x.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
