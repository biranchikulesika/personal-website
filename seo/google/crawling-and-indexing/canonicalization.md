# Canonicalization

Canonicalization is the process of selecting the representative (canonical) URL for a piece of content when the same content is accessible from multiple URLs.

## What Google says

### Why canonicalization matters

Duplicate content can occur due to:
- Protocol variants (HTTP vs HTTPS)
- Device variants (mobile vs desktop)
- URL parameters (sorting, filtering)
- www vs non-www
- Trailing slash variations

Having the same content at multiple URLs:
- Confuses users (which is the "right" URL?)
- Wastes crawl budget
- Dilutes ranking signals across multiple URLs

### How to specify a canonical URL

In order of signal strength:

1. **Redirects (301)**: Strongest signal. Redirect non-preferred URLs to the canonical.
2. **`rel="canonical"` link element**: Strong signal. Add `<link rel="canonical" href="...">` in the `<head>`.
3. **Sitemap inclusion**: Weak signal. List canonical URLs in your sitemap.

These methods can be combined for stronger effect.

### Best practices

- Use absolute URLs (not relative paths)
- Include a self-referential canonical on the canonical page itself
- Don't specify different canonicals using different methods for the same page
- Don't use URL fragments as canonicals
- Don't use robots.txt for canonicalization
- Don't use the URL removal tool for canonicalization
- When linking within your site, link to the canonical URL

### HTTPS preference

Google prefers HTTPS pages as canonical. Ensure:
- Valid SSL certificate
- No HTTPS-to-HTTP redirects
- No `rel="canonical"` pointing to HTTP

## What this means for this website

This site has a simple URL structure with no duplicate URL issues:

- Single protocol: HTTPS (enforced via HSTS)
- Single hostname: No www/non-www variation
- No URL parameters on content URLs
- Clean slug-based URLs (`/p/slug`, `/n/slug`)

### Current implementation

Every content page sets a canonical URL via Next.js metadata:

```typescript
// lib/seo.ts
alternates: { canonical: `${SITE_URL}/p/${post.slug}` }
```

The `SITE_URL` is resolved from environment variables, ensuring consistency.

### When to review canonicalization

- After adding new routes or changing URL patterns
- If content becomes accessible via multiple URLs
- When restructuring the site

## Checklist

- [ ] Every content page has a `rel="canonical"` (via `alternates.canonical`)
- [ ] Canonical URLs use absolute paths with the site's domain
- [ ] No duplicate content accessible via multiple URLs
- [ ] Sitemap contains only canonical URLs
- [ ] Internal links point to canonical URLs

## Source

Google Search Central:
[Canonicalization](https://developers.google.com/search/docs/crawling-indexing/canonicalization)
[Consolidate duplicate URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
