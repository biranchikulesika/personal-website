# Robots Meta Tags and X-Robots-Tag

Control how individual pages are indexed and served in search results.

## What Google says

### Robots meta tag

Place in the `<head>` section of HTML:

```html
<meta name="robots" content="noindex">
```

For Google-specific rules:
```html
<meta name="googlebot" content="noindex">
```

### X-Robots-Tag HTTP header

For non-HTML resources (PDFs, images) or site-wide rules:

```
X-Robots-Tag: noindex
```

### Available rules

| Rule | Effect |
|------|--------|
| `noindex` | Don't show this page in search results |
| `nofollow` | Don't follow links on this page |
| `none` | Equivalent to `noindex, nofollow` |
| `nosnippet` | Don't show text snippet or video preview |
| `max-snippet:[number]` | Maximum snippet length in characters |
| `max-image-preview:[setting]` | `none`, `standard`, or `large` |
| `max-video-preview:[number]` | Maximum video preview in seconds |
| `noimageindex` | Don't index images on this page |
| `unavailable_after:[date]` | Don't show after specified date |
| `notranslate` | Don't offer translation |
| `indexifembedded` | Allow indexing when embedded in iframe (only with `noindex`) |

### Combining rules

Multiple rules can be combined with commas:

```html
<meta name="robots" content="noindex, nosnippet">
```

When multiple conflicting rules exist, the more restrictive rule applies.

### Important notes

- `robots.txt` blocking prevents Google from seeing meta tags (the page won't be crawled)
- `noindex` requires the page to be crawlable to work
- Google respects robots meta tags in the body, not just `<head>`

## What this means for this website

### Current implementation

**Admin routes** (`next.config.ts`):
```typescript
{
  source: '/admin/:path*',
  headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
}
```

**Content pages** (`lib/seo.ts`):
```typescript
// Root metadata — all pages are indexable by default
robots: {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    'max-video-preview': -1,
    'max-image-preview': 'large',
    'max-snippet': -1,
  },
}

// Unpublished content — noindex
robots: isDraft ? { index: false, follow: false } : undefined
```

### Rules summary

| Content | robots directive | Mechanism |
|---------|-----------------|-----------|
| Public pages | `index: true, follow: true` | Root metadata |
| Admin routes | `noindex, nofollow` | X-Robots-Tag header |
| Unpublished posts/notes | `index: false, follow: false` | Page metadata |
| OG images (`/api/og`) | Allowed (not blocked by robots.txt) | robots.txt allow rule |

## Checklist

- [ ] All public pages allow indexing
- [ ] Admin routes are noindexed
- [ ] Unpublished content is noindexed
- [ ] No accidental noindex on public pages
- [ ] `max-image-preview: large` allows rich previews

## Source

Google Search Central:
[Robots meta tag, data-nosnippet, and X-Robots-Tag](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag)
[Block indexing with noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing)
