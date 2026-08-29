# SEO Implementation Notes

How SEO is currently implemented in this codebase. This describes the **actual** implementation as of August 2026.

---

## Metadata generation

### Root metadata (`app/layout.tsx` → `lib/seo.ts`)

The root layout exports `rootMetadata` which provides base metadata for all pages:

```typescript
export const metadata: Metadata = rootMetadata;
```

`rootMetadata` includes:
- `metadataBase`: Set to `SITE_URL` (from environment variable)
- `title.default`: `SITE_NAME` ("Biranchi Kulesika")
- `title.template`: `%s | Biranchi Kulesika` (applies to child pages)
- `description`: `SITE_DESCRIPTION`
- `authors`, `creator`: Site name
- `openGraph`: type `website`, locale `en_US`, siteName, default OG image
- `twitter`: card `summary_large_image`, creator `@BKulesika`, default image
- `robots`: `index: true, follow: true` with `googleBot` settings for max previews
- `icons`: ICO, SVG, PNG favicons, Apple touch icon
- `manifest`: `/manifest.webmanifest`

### Page-specific metadata (`lib/seo.ts`)

Each page type has a dedicated metadata builder function:

| Function | File | Description |
|----------|------|-------------|
| `homeMetadata()` | `lib/seo.ts` | Home page — absolute title, canonical to site root |
| `aboutMetadata()` | `lib/seo.ts` | About page — profile type OG, canonical |
| `libraryMetadata()` | `lib/seo.ts` | Library page — website type OG, canonical |
| `scribbleMetadata()` | `lib/seo.ts` | Scribble page — website type OG, canonical |
| `nowMetadata()` | `lib/seo.ts` | Now page — website type OG, canonical |
| `supportMetadata()` | `lib/seo.ts` | Support page — website type OG, canonical |
| `postMetadata(post)` | `lib/seo.ts` | Blog posts — article type OG, canonical, published/modified dates, tags |
| `noteMetadata(note)` | `lib/seo.ts` | Notes — article type OG, canonical, tags |

All metadata functions:
- Set `alternates: { canonical: url }` with absolute URLs
- Include Open Graph images via dynamic `/api/og` endpoint
- Include Twitter card metadata
- Set `robots: { index: false, follow: false }` for unpublished content

### Dynamic metadata (`app/(site)/p/[slug]/page.tsx`, `app/(site)/n/[slug]/page.tsx`)

Posts and notes use `generateMetadata()` to dynamically generate metadata from the database:

```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const post = await new ContentService().getPost(slug);
  if (!post || post.status === 'unpublished') {
    return { title: 'Post not found', robots: { index: false, follow: false } };
  }
  return postMetadata(post);
}
```

---

## Canonical URLs

Every public content page sets a canonical URL:

```typescript
alternates: { canonical: url }
```

Where `url` is constructed as `${SITE_URL}/p/${slug}` for posts and `${SITE_URL}/n/${slug}` for notes. The `SITE_URL` is resolved from environment variables via `lib/config/env.ts`.

**Current status**: ✅ Implemented on all content pages.

---

## Open Graph images

OG images are generated dynamically via `app/api/og/route.tsx` using Next.js `ImageResponse`.

### Generation modes

The `/api/og` endpoint supports multiple modes via query parameters:

| Parameter | Mode | Description |
|-----------|------|-------------|
| `?type=home` | Home | Hero layout with site name, greeting, headline, photo |
| `?type=about` | About | Photo mosaic layout with description |
| `?type=library` | Library | Book covers layout with title |
| `?type=scribble` | Scribble | Editorial card composition |
| `?type=now` | Now | Latest entry display |
| `?type=support` | Support | Patronage message layout |
| `?slug=xxx` | Post/Note | Dynamic layout with title, description, cover image |

### Caching

OG responses are cached in-memory for 24 hours:
- `OG_RESPONSE_CACHE`: Map of search params → ArrayBuffer
- `MAX_OG_CACHE_ENTRIES`: 60
- `OG_CACHE_TTL_MS`: 24 hours
- Cache headers: `Cache-Control: public, max-age=86400, stale-while-revalidate=604800`

### CORS

OG images are served with `Access-Control-Allow-Origin: *` to allow social media crawlers (Twitter, Facebook, LinkedIn) to fetch them.

---

## Structured data (JSON-LD)

### Root layout (`app/layout.tsx`)

```typescript
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(websiteJsonLd()) }} />
```

**`websiteJsonLd()`** (defined in `lib/seo.ts`) produces:
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Biranchi Kulesika",
  "url": "https://biranchikulesika.com",
  "description": "...",
  "inLanguage": "en-US",
  "author": {
    "@type": "Person",
    "name": "Biranchi Kulesika",
    "url": "...",
    "jobTitle": "Software Developer & Writer",
    "sameAs": ["github...", "x.com...", "linkedin...", "instagram..."],
    "knowsAbout": ["Software Engineering", ...]
  }
}
```

### Blog post pages (`app/(site)/p/[slug]/page.tsx`)

```typescript
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(articleJsonLd(post)) }} />
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbs) }} />
```

**`articleJsonLd(post)`** produces `@type: "Article"` with `headline`, `description`, `author`, `publisher`, `datePublished`, `dateModified`, `url`, `image`, `keywords`.

### Note pages (`app/(site)/n/[slug]/page.tsx`)

Same pattern as posts, using `noteJsonLd(note)` which also produces `@type: "Article"`.

### Breadcrumb structured data

`breadcrumbJsonLd(items)` is used on content pages:

```typescript
const breadcrumbs = breadcrumbJsonLd([
  { name: 'Home', url: '/' },
  { name: 'Scribble', url: '/scribble' },
  { name: post.title, url: `/p/${post.slug}` },
]);
```

### XSS protection

All JSON-LD is passed through `safeJsonLd()` which escapes `<` to `\u003c` to prevent `</script>` injection:

```typescript
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
```

**Current status**: ✅ Implemented. WebSite, Article, and BreadcrumbList schemas are in place.

---

## Sitemap (`app/sitemap.ts`)

Dynamic sitemap generated via Next.js `MetadataRoute.Sitemap`:

- **Static pages**: `/`, `/about`, `/library`, `/scribble`, `/now`, `/support` with appropriate priorities
- **Posts**: All posts where `status !== 'unpublished'`, priority 0.7
- **Notes**: All notes where `status !== 'unpublished'`, priority 0.6
- **Excluded**: Admin routes, `/api/`, `/fund` (redirects to `/support`)

Uses `ContentService` to fetch all posts and notes from Supabase.

---

## Robots.txt (`app/robots.ts`)

```typescript
{
  rules: [{ userAgent: '*', allow: ['/', '/api/og'], disallow: ['/api/'] }],
  sitemap: `${SITE_URL}/sitemap.xml`,
  host: SITE_URL,
}
```

- Allows crawling of `/` and `/api/og` (for social media previews)
- Blocks all other `/api/` routes
- Declares sitemap location

---

## Admin route protection

### Proxy middleware (`proxy.ts`)

- All `/admin` routes require Supabase authentication
- Unauthenticated requests redirect to `/admin/login`
- Authenticated users on `/admin/login` redirect to `/admin`

### HTTP headers (`next.config.ts`)

```typescript
{ source: '/admin/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }
```

Admin routes are double-protected: authentication + noindex header.

---

## Redirects (`next.config.ts`)

```typescript
redirects: async () => [
  { source: '/fund', destination: '/support', permanent: true },
]
```

The old `/fund` URL permanently redirects (301) to `/support`.

---

## Image optimization (`next.config.ts`)

- Formats: AVIF, WebP
- Remote patterns: Wikimedia, Unsplash, GitHub, Pexels, Supabase, custom domains
- Images served through Next.js `Image` component with automatic optimization

---

## Fonts and rendering

- **Space Grotesk**: Used for UI/metadata elements (sans-serif)
- **Newsreader**: Used for long-form prose (serif)
- Both use `display: 'swap'` to prevent FOIT (Flash of Invisible Text)

---

## Known TODOs

These are areas that could be improved:

1. **`<h1>` tags**: Verify that each page has a single, clear `<h1>` heading
2. **Alt text**: Ensure all images in content have descriptive alt text
3. **`rel="nofollow"` on external links**: Consider adding `rel="noopener noreferrer"` to external links
4. **Search Console verification**: Verify that the site is registered in Google Search Console
5. **Article date consistency**: Ensure `datePublished` and `dateModified` in structured data match user-visible dates on the page
6. **Breadcrumb depth**: Current breadcrumbs go Home → Section → Content; verify this matches actual user navigation paths
