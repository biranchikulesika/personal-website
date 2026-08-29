# Controlling Indexing

Methods to prevent specific content from appearing in Google Search results.

## What Google says

### Methods to control indexing

| Method | Effect | Use case |
|--------|--------|----------|
| `noindex` meta tag | Prevents indexing of specific pages | Pages you don't want in search results |
| `X-Robots-Tag: noindex` header | Same as meta tag, but via HTTP header | Non-HTML files or site-wide rules |
| `robots.txt` Disallow | Prevents crawling (not indexing!) | Resources, API endpoints |
| Password protection | Prevents both crawling and indexing | Private content |
| `noindex` + `robots.txt` Disallow | ⚠️ Conflicting: `noindex` won't work if page can't be crawled | Don't do this |

### Key distinction

- **robots.txt** prevents **crawling** — Googlebot won't fetch the page
- **noindex** prevents **indexing** — Googlebot crawls the page but doesn't add it to the index
- For `noindex` to work, the page must be crawlable (not blocked by robots.txt)

### Removal tool

Google Search Console's URL removal tool provides **temporary** removal (about 6 months). For permanent removal, use `noindex` or password protection.

## What this means for this website

### Content that should be indexed

- All public pages (`/`, `/about`, `/library`, `/scribble`, `/now`, `/support`)
- All published posts (`/p/[slug]`)
- All published notes (`/n/[slug]`)

### Content that should NOT be indexed

- Admin routes (`/admin/*`) — protected via `X-Robots-Tag: noindex` header
- API routes (`/api/*`) — blocked via robots.txt
- Unpublished content — protected via `robots: { index: false, follow: false }` in metadata

### Implementation

**Admin routes** use HTTP headers (not robots.txt) so the noindex tag can be seen:
```typescript
// next.config.ts
{ source: '/admin/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }
```

**Unpublished content** uses page-level metadata:
```typescript
// lib/seo.ts
robots: isDraft ? { index: false, follow: false } : undefined
```

## Checklist

- [ ] Public content is not accidentally noindexed
- [ ] Admin routes have noindex via HTTP headers (not robots.txt)
- [ ] Unpublished content returns noindex in metadata
- [ ] Noconflicting signals (e.g., noindex in meta tag but no crawlability)

## Source

Google Search Central:
[Block indexing with noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing)
[Control what you share](https://developers.google.com/search/docs/crawling-indexing/control-what-you-share)
