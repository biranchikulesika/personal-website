# SEO Architecture

This document describes the site's architecture from an SEO perspective.

## Site overview

This is a personal website for Biranchi Kulesika. It is a Next.js application deployed on Vercel, using Supabase as the database. The site contains personal content: essays, notes, a reading library, scribbles, and support/patronage information.

## Route structure

### Public routes (indexed)

| Route | Type | Description | Priority |
|-------|------|-------------|----------|
| `/` | Static | Homepage with hero, featured posts, featured books | 1.0 |
| `/about` | Static | About page with bio and writing | 0.8 |
| `/library` | Static | Reading catalog (books from Supabase) | 0.8 |
| `/scribble` | Static | Aggregated index of essays, notes, and books | 0.9 |
| `/now` | Dynamic | "Now" timeline entries | 0.8 |
| `/support` | Static | Support and patronage page | 0.7 |
| `/p/[slug]` | Static (SSG) | Individual blog posts/essays | 0.7 |
| `/n/[slug]` | Static (SSG) | Individual atomic notes | 0.6 |

### Admin routes (noindex)

| Route | Auth | Description |
|-------|------|-------------|
| `/admin` | Required | Admin dashboard |
| `/admin/login` | Public | Login page |
| `/admin/compose` | Required | Content editor |

### API routes

| Route | Description | Indexed |
|-------|-------------|---------|
| `/api/og` | Dynamic OG image generation | No (allowed in robots.txt for social crawlers) |

## Content types

1. **Blog Posts/Essays** (`/p/[slug]`): Long-form content with sections, figures, quotes. Generated at build time via `generateStaticParams()`.

2. **Atomic Notes** (`/n/[slug]`): Shorter-form notes with tags and personas. Generated at build time via `generateStaticParams()`.

3. **Books** (in Library): Reading catalog entries with author, description, cover image. No dedicated routes — displayed on `/library`.

4. **Now Entries** (in Now page): Timeline entries showing current focus. Displayed on `/now` (force-dynamic).

5. **Scribble Entries**: Aggregated feed combining posts, notes, and books. Displayed on `/scribble`.

## URL design

- Clean, descriptive slugs (e.g., `/p/my-essay-title`)
- No query parameters on content URLs
- Consistent URL patterns: `/p/` for posts, `/n/` for notes
- The `/fund` route permanently redirects (301) to `/support`

## Canonical URL strategy

- Every content page sets a canonical URL via `alternates: { canonical: url }` in metadata
- Canonical URLs use absolute paths with the site's domain
- No duplicate URL patterns exist (no www/non-www issues, no trailing slash variations)
- Admin routes are not in the sitemap and are blocked via `X-Robots-Tag` headers

## Static generation

- Posts and notes use `generateStaticParams()` for static generation at build time
- The Now page uses `force-dynamic` for real-time content
- All other pages are statically rendered at build time
- Dynamic OG images are generated on-demand via `/api/og`

## Content delivery

- Deployed on Vercel with edge network
- HTTPS enforced with HSTS headers
- Images served through Next.js Image Optimization (AVIF/WebP formats)
- OG images cached for 24 hours with stale-while-revalidate
