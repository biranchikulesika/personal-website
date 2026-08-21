# SEO & AI Discoverability

The website implements an SEO and AI-crawlable structure designed for modern search engines and LLM web crawlers.

---

## 1. Metadata Engine (`lib/seo.ts`)

All metadata generation is centralized in [`lib/seo.ts`](file:///home/biranchikulesika/Projects/biranchi/lib/seo.ts) to guarantee consistent Open Graph tags, canonical URLs, and structured data across the entire site.

### Base Metadata (`rootMetadata`)
Applied at the root layout (`app/layout.tsx`):
- **`metadataBase`**: Canonical production origin (`https://biranchikulesika.com`).
- **Title Template**: `%s | Biranchi Kulesika`.
- **Crawler Directives**: `max-image-preview: large`, `max-snippet: -1`, `max-video-preview: -1`.
- **Twitter Card**: `summary_large_image` with `@BKulesika` creator attribution.

### Page-Specific Metadata Builders
- **`postMetadata(post: BlogPost)`**:
  - Dynamically calculates canonical URL: `https://biranchikulesika.com/p/${slug}`.
  - Injects `article` Open Graph type, `publishedTime`, `modifiedTime`, tags, and dynamic OG image endpoint `/api/og?slug=${slug}`.
  - If `post.status === 'unpublished'`, automatically injects `robots: { index: false, follow: false }`.
- **`noteMetadata(note: NoteItem)`**:
  - Calculates canonical URL: `https://biranchikulesika.com/n/${slug}`.
  - Sets article tags, persona tags, and draft noindex guards.

---

## 2. Structured Data (JSON-LD)

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

## 3. Dynamic Sitemap (`app/sitemap.ts`)

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

## 4. Robots Configuration (`app/robots.ts`)

Generates `robots.txt` dynamically:
- **`Allow: /`**: Grants access to all public content.
- **`Disallow: /api/`**: Disallows private API endpoints.
- **Sitemap Declaration**: Points to `${SITE_URL}/sitemap.xml`.
- **Crucial Security Rule**: `/admin` is **NEVER** mentioned in `robots.txt` to prevent disclosing private attack surfaces.

---

## 5. Duplicate Route & Redirect Management

- `/fund` permanently redirects (`308`) to canonical `/support` via [`next.config.ts`](file:///home/biranchikulesika/Projects/biranchi/next.config.ts) and [`app/(site)/fund/page.tsx`](file:///home/biranchikulesika/Projects/biranchi/app/%28site%29/fund/page.tsx).
- Search and query parameters on `/scribble` and `/library` are filtered client-side, preventing search engines from indexing thin query-string result pages.
