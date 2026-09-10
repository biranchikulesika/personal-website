# SEO & AI Discoverability

The website implements an SEO and AI-crawlable structure designed for modern search engines and LLM web crawlers.

---

## 1. Metadata Engine (`lib/seo.ts`)

All metadata generation is centralized in [`lib/seo.ts`](../lib/seo.ts) to guarantee consistent Open Graph tags, canonical URLs, and structured data across the entire site.

### Base Metadata (`rootMetadata`)
Applied at the root layout (`app/layout.tsx`):
- **`metadataBase`**: Canonical production origin (`https://biranchikulesika.com`).
- **Title Template**: `%s | Biranchi Kulesika`.
- **Crawler Directives**: `max-image-preview: large`, `max-snippet: -1`, `max-video-preview: -1`.
- **Twitter Card**: `summary_large_image` with `@BKulesika` creator attribution.

### Page-Specific Metadata Builders
- **`homeMetadata()`**: Points to `/api/og?type=home`.
- **`aboutMetadata()`**: Points to `/api/og?type=about`.
- **`libraryMetadata()`**: Points to `/api/og?type=library`.
- **`scribbleMetadata()`**: Points to `/api/og?type=scribble`.
- **`nowMetadata()`**: Points to `/api/og?type=now`.
- **`supportMetadata()`**: Points to `/api/og?type=support`.
- **`postMetadata(post: BlogPost)`**:
  - Dynamically calculates canonical URL: `https://biranchikulesika.com/p/${slug}`.
  - Injects `article` Open Graph type, `publishedTime`, `modifiedTime`, tags, and dynamic OG image endpoint `/api/og?slug=${slug}`.
  - If `post.status === 'unpublished'`, automatically injects `robots: { index: false, follow: false }`.
- **`noteMetadata(note: NoteItem)`**:
  - Calculates canonical URL: `https://biranchikulesika.com/n/${slug}`.
  - Injects dynamic OG image endpoint `/api/og?slug=${slug}&type=note`.
  - Sets article tags, persona tags, and draft noindex guards.

---

## 2. Dynamic Open Graph System (`/api/og`)

Social preview cards are generated on-demand at edge using `@vercel/og` (`ImageResponse`), producing 1200x630 PNG images following the site's dark editorial ledger aesthetic.

### Dynamic Endpoint Paths & Previews

| Target Page | API Path | Dynamic Content Rendered |
| :--- | :--- | :--- |
| **Home (`/`)** | `/api/og?type=home` | Homepage hero portrait (`/biranchi.jpeg`), editorial greeting (`"Hi, I'm Biranchi."`), headline, and supporting copy. |
| **About (`/about`)** | `/api/og?type=about` | Angled 2-column skewed photo grid of personal photos, page headline, and introductory description. |
| **Library (`/library`)** | `/api/og?type=library` | 3D layered book cover stack from reading catalog, catalog count, and description (`"Books I've read, loved, and recommend for others to read."`). |
| **Scribble (`/scribble`)** | `/api/og?type=scribble` | Staggered index ledger cards with color-coded accent borders (Terracotta, Sea-Blue, Sage), persona badges, and excerpts. |
| **Now (`/now`)** | `/api/og?type=now` | Live pulse status, latest timeline update snippet, and chronological node telemetry. |
| **Support (`/support`)** | `/api/og?type=support` | Unboxed numbered editorial ledger (`01`, `02`, `03`) outlining independent craft pillars with background watermark. |
| **Essay (`/p/[slug]`)** | `/api/og?slug=[slug]` | Essay title, description, persona label, and full-bleed cover image. |
| **Atomic Note (`/n/[slug]`)** | `/api/og?slug=[slug]&type=note` | Note title, snippet/subtitle, persona label, and attached media. |

### Query Parameters

- **`type`**: `home` | `about` | `library` | `scribble` | `now` | `support` | `post` | `note`
- **`slug`**: Identifier for individual post or note.
- **`title`**: Override headline text (optional).
- **`description`**: Override supporting text or excerpt (optional).
- **`persona`**: Persona label (`Builder`, `Thinker`, `Craftsman`) for custom cards (optional).
- **`cover`**: External or local cover image URL (optional).

### Design Specifications
- **Dimensions**: `1200 × 630 px` (standard Open Graph aspect ratio `1.91:1`).
- **Canvas Base**: `#141413` with top tri-color accent strip (`linear-gradient(90deg, #D97757 0%, #04A4BA 50%, #788C5D 100%)`).
- **Typography**: Editorial Serif for prose & headlines; Space Grotesk / Sans-Serif for technical metadata, tags, and domain branding.
- **Image Resolution & Fallbacks**: Remote images are fetched and base64-encoded to guarantee deterministic SSR rasterization with SSRF protection against private IP ranges. Self-healing curated fallbacks ensure all cards render without empty spines or broken placeholders.


---

## 3. Structured Data (JSON-LD)

Schema.org structured data is injected into HTML `<head>` tags to provide semantic interpretability for AI crawlers (ChatGPT, Claude, Perplexity) and Google Knowledge Graph.

### 1. WebSite & Person Knowledge Graph (`websiteJsonLd`)
Injected in `app/layout.tsx`:
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Biranchi Kulesika",
  "url": "https://biranchikulesika.com",
  "inLanguage": "en-US",
  "author": {
    "@type": "Person",
    "name": "Biranchi Kulesika",
    "url": "https://biranchikulesika.com",
    "jobTitle": "Software Developer & Writer",
    "sameAs": [
      "https://github.com/biranchikulesika",
      "https://x.com/BKulesika",
      "https://www.linkedin.com/in/biranchikulesika"
    ],
    "knowsAbout": [
      "Software Engineering",
      "Web Architecture",
      "Cybersecurity",
      "Computer Science",
      "Philosophy"
    ]
  }
}
```

### 2. Article Schema (`articleJsonLd` & `noteJsonLd`)
Injected on essay (`/p/[slug]`) and note (`/n/[slug]`) pages:
- Declares `@type: 'Article'`, `headline`, `datePublished`, `dateModified`, `author`, `publisher`, `keywords`, and `mainEntityOfPage`.

### 3. Breadcrumb Hierarchy (`breadcrumbJsonLd`)
Injected on deep pages (`/about`, `/library`, `/scribble`, `/p/[slug]`, `/n/[slug]`):
- Declares `@type: 'BreadcrumbList'` with 1-based index positions mapping the navigation path back to Home.

---

## 4. Dynamic Sitemap (`app/sitemap.ts`)

Generates `sitemap.xml` dynamically on each crawl request:
- **Included Routes**:
  - Static core pages (`/`, `/about`, `/library`, `/scribble`, `/support`).
  - All published essays (`/p/[slug]`) with dynamic `lastModified` timestamps.
  - All published atomic notes (`/n/[slug]`) with dynamic `lastModified` timestamps.
- **Excluded Routes**:
  - Admin paths (`/admin/**`) — strictly excluded.
  - Now page (`/now`) — real-time living status, excluded from index.
  - Drafts and unpublished content.
  - Duplicate redirects (`/fund`).

---

## 5. Robots Configuration (`app/robots.ts`)

Generates `robots.txt` dynamically:
- **`Allow: /`**: Grants access to all public content.
- **`Disallow: /api/`**: Disallows private API endpoints.
- **Sitemap Declaration**: Points to `${SITE_URL}/sitemap.xml`.
- **Crucial Security Rule**: `/admin` is **NEVER** mentioned in `robots.txt` to prevent disclosing private attack surfaces.

---

## 6. Duplicate Route & Redirect Management

- `/fund` permanently redirects (`308`) to canonical `/support` via [`next.config.ts`](../next.config.ts) and [`app/(site)/fund/page.tsx`](../app/(site)/fund/page.tsx).
- Search and query parameters on `/scribble` and `/library` are filtered client-side, preventing search engines from indexing thin query-string result pages.

