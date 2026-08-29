# Article Structured Data

Article structured data helps Google understand your content and can enable rich results like headline, image, and date display in search.

## What Google says

### Schema types

Google supports these Article types:
- `Article` — general articles
- `NewsArticle` — news-specific articles
- `BlogPosting` — blog posts

All three follow the same requirements. Choose the most specific type that applies.

### Recommended properties

| Property | Type | Description |
|----------|------|-------------|
| `headline` | Text | Title of the article (keep concise) |
| `image` | URL or ImageObject | Representative image (provide multiple sizes for best results) |
| `datePublished` | DateTime | ISO 8601 format publication date |
| `dateModified` | DateTime | ISO 8601 format last modification date |
| `author` | Person or Organization | Author with `name` and `url` |
| `publisher` | Organization or Person | Publisher with `name` and logo |

### Guidelines

- All required properties must be present
- Follow general structured data guidelines
- The content must be visible on the page
- For multi-part articles, canonical should point to each individual page or a "view-all" page

## What this means for this website

### Current implementation

**Blog posts** (`lib/seo.ts` — `articleJsonLd(post)`):
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Post Title",
  "description": "Post description",
  "author": {
    "@type": "Person",
    "name": "Biranchi Kulesika",
    "url": "https://biranchikulesika.com"
  },
  "publisher": {
    "@type": "Person",
    "name": "Biranchi Kulesika",
    "url": "https://biranchikulesika.com"
  },
  "datePublished": "2024-01-15T08:00:00Z",
  "dateModified": "2024-02-01T10:30:00Z",
  "url": "https://biranchikulesika.com/p/post-slug",
  "image": "...",
  "keywords": "tag1, tag2",
  "inLanguage": "en-US"
}
```

**Notes** (`lib/seo.ts` — `noteJsonLd(note)`):
Same structure as posts, also using `@type: "Article"`.

### Publisher type

Currently, `publisher` is set to `Person` (same as author). For a personal site this is correct — the site owner is both author and publisher. If the site were to publish other authors' work, `publisher` should be changed to `Organization`.

## Checklist

- [ ] `headline` is present and accurate
- [ ] `datePublished` is in ISO 8601 format
- [ ] `dateModified` reflects actual last modification
- [ ] `author` includes `name` and `url`
- [ ] `image` URL is crawlable and accessible
- [ ] `publisher` is set correctly
- [ ] Structured data matches visible page content

## Source

Google Search Central:
[Article structured data](https://developers.google.com/search/docs/appearance/structured-data/article)
