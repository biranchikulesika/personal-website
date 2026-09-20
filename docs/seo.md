# SEO and Metadata Architecture

The website implements an SEO and crawlable structure designed for search engines and LLM web crawlers.

---

## 1. Metadata Engine (`lib/seo.ts`)

Metadata generation is centralized in `lib/seo.ts` to guarantee consistent Open Graph tags, canonical URLs, and structured data.

### Base Metadata (`rootMetadata`)
Applied at the root layout in `app/layout.tsx`:
- **`metadataBase`**: Canonical production origin (`https://biranchikulesika.com`).
- **Title Template**: `%s | Biranchi Kulesika`.
- **Crawler Directives**: `max-image-preview: large`, `max-snippet: -1`, `max-video-preview: -1`.
- **Twitter Card**: `summary_large_image` with creator attribution `@BKulesika`.

### Page-Specific Metadata Builders
- **`homeMetadata()`**: Base home metadata pointing to `/api/og?type=home`.
- **`aboutMetadata()`**: About page metadata pointing to `/api/og?type=about`.
- **`libraryMetadata()`**: Reading catalog metadata pointing to `/api/og?type=library`.
- **`scribbleMetadata()`**: Unified writing feed metadata pointing to `/api/og?type=scribble`.
- **`nowMetadata()`**: Living timeline metadata pointing to `/api/og?type=now`.
- **`supportMetadata()`**: Support page metadata pointing to `/api/og?type=support`.
- **`postMetadata(post)`**:
  - Sets canonical URL to `https://biranchikulesika.com/p/${slug}`.
  - Injects `article` Open Graph type, `publishedTime`, `modifiedTime`, tags, and dynamic OG image endpoint `/api/og?slug=${slug}`.
  - If `post.status === 'unpublished'`, automatically injects `robots: { index: false, follow: false }`.
- **`noteMetadata(note)`**:
  - Sets canonical URL to `https://biranchikulesika.com/n/${slug}`.
  - Injects dynamic OG image endpoint `/api/og?slug=${slug}&type=note`.
  - Sets article tags, persona tags, and draft noindex guards.

---

## 2. Dynamic Open Graph Cards (`/api/og`)

Social preview cards are generated on demand at the edge using `@vercel/og`, producing 1200 × 630 pixel PNG images matching the dark editorial layout:

| Page | API Query | Content Rendered |
| :--- | :--- | :--- |
| **Home (`/`)** | `/api/og?type=home` | Hero portrait (`/biranchi.jpeg`), greeting, headline, and bio snippet. |
| **About (`/about`)** | `/api/og?type=about` | Angled photo grid, page headline, and introductory description. |
| **Library (`/library`)** | `/api/og?type=library` | 3D layered book covers from the reading catalog and recommendation count. |
| **Scribble (`/scribble`)** | `/api/og?type=scribble` | Staggered index ledger cards with color accents and persona badges. |
| **Now (`/now`)** | `/api/og?type=now` | Status indicator and latest timeline entry excerpt. |
| **Support (`/support`)** | `/api/og?type=support` | Numbered editorial ledger outlining independent craft pillars. |
| **Essay (`/p/[slug]`)** | `/api/og?slug=[slug]` | Essay title, description, persona label, and cover image. |
| **Note (`/n/[slug]`)** | `/api/og?slug=[slug]&type=note` | Note title, snippet, and persona label. |

---

## 3. Structured Data (JSON-LD)

Schema.org structured data is injected into HTML `<head>` tags to provide semantic information for search engines and AI knowledge graphs.

### 1. WebSite and Person Schema (`websiteJsonLd`)
Injected in `app/layout.tsx`:
- Declares `@type: 'WebSite'` and `@type: 'Person'`.
- Includes author name, canonical URL, job title, social profiles (GitHub, X, LinkedIn), and topics of expertise.

### 2. Article Schema (`articleJsonLd` and `noteJsonLd`)
Injected on essay (`/p/[slug]`) and note (`/n/[slug]`) pages:
- Declares `@type: 'Article'`, `headline`, `datePublished`, `dateModified`, `author`, `publisher`, and `keywords`.

### 3. Breadcrumb Hierarchy (`breadcrumbJsonLd`)
Injected on nested pages (`/about`, `/library`, `/scribble`, `/now`, `/support`, `/p/[slug]`, `/n/[slug]`):
- Declares `@type: 'BreadcrumbList'` with 1-based index positions mapping the navigation path back to Home.

---

## 4. Dynamic Sitemap (`app/sitemap.ts`)

Generates `sitemap.xml` dynamically:
- **Included Routes**:
  - Core static pages: `/`, `/about`, `/library`, `/scribble`, `/now`, `/support`.
  - All published essays (`/p/[slug]`) with dynamic `lastModified` dates.
  - All published notes (`/n/[slug]`) with dynamic `lastModified` dates.
- **Excluded Routes**:
  - Admin paths (`/admin/**`).
  - Drafts and unpublished content (`status === 'unpublished'`).
  - Redirect routes (`/fund`).

---

## 5. Robots Configuration (`app/robots.ts`)

Generates `robots.txt` dynamically:
- **`Allow: /`**: Allows crawling of all public pages.
- **`Disallow: /api/`**: Disallows crawling of private API endpoints.
- **Sitemap Link**: References `${SITE_URL}/sitemap.xml`.
- **Admin Isolation**: Admin routes (`/admin`) are never mentioned in `robots.txt`, preventing disclosure of administrative paths to scrapers. Admin pages are instead protected via `X-Robots-Tag: noindex, nofollow` HTTP headers and meta tags.
