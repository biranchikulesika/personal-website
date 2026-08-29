# robots.txt

A robots.txt file tells crawlers which pages or files they can or cannot request from your site.

## What Google says

### How it works

- robots.txt is a file at the root of your site (e.g., `https://example.com/robots.txt`)
- It uses the Robots Exclusion Protocol
- Each rule applies to specific user agents
- `Allow` permits crawling; `Disallow` prevents it
- `Sitemap` declares the location of your sitemap

### Important limitations

- **robots.txt prevents crawling, not indexing.** If a page is linked from other sites, Google may still index it even if robots.txt blocks crawling. Use `noindex` to prevent indexing.
- **robots.txt is public.** Anyone can see what you're blocking.
- **Different crawlers may interpret rules differently.** Google follows the standard, but other crawlers may not.

### Best practices

- Use robots.txt to prevent crawling of duplicate content or unimportant resources
- Don't use robots.txt to hide pages from search results (use `noindex` instead)
- Block state-changing URLs (posting comments, adding to cart, etc.)
- Allow crawling of resources needed for rendering (CSS, JS, images)
- Declare your sitemap location

## What this means for this website

### Current implementation (`app/robots.ts`)

```typescript
{
  rules: [
    {
      userAgent: '*',
      allow: ['/', '/api/og'],
      disallow: ['/api/'],
    },
  ],
  sitemap: `${SITE_URL}/sitemap.xml`,
  host: SITE_URL,
}
```

### What this does

| Path | Status | Reason |
|------|--------|--------|
| `/` | ✅ Allowed | Main content |
| `/api/og` | ✅ Allowed | OG images need to be fetchable by social crawlers |
| `/api/*` (other) | ❌ Blocked | API routes should not be crawled |
| `/admin/*` | ⚠️ Not in robots.txt | Blocked via `X-Robots-Tag` header instead |

### Why admin routes aren't in robots.txt

Admin routes are protected by authentication (proxy middleware) and `X-Robots-Tag: noindex` headers. Adding them to robots.txt would prevent Google from seeing the noindex tag, which could cause indexing issues.

## Checklist

- [ ] robots.txt is accessible at `/robots.txt`
- [ ] Public content is allowed for crawling
- [ ] `/api/og` is allowed (for social media previews)
- [ ] Other `/api/` routes are blocked
- [ ] Sitemap location is declared
- [ ] No important content is accidentally blocked

## Source

Google Search Central:
[robots.txt](https://developers.google.com/search/docs/crawling-indexing/robots/intro)
