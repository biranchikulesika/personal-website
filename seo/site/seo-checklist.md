# SEO Checklist

A practical checklist for this website. Use this when reviewing SEO implementation or making changes.

---

## Crawlability

- [ ] **robots.txt** allows crawling of all public content
- [ ] **robots.txt** blocks `/api/` routes (except `/api/og` for social crawlers)
- [ ] **robots.txt** declares sitemap location
- [ ] **Sitemap** includes all public static pages (`/`, `/about`, `/library`, `/scribble`, `/now`, `/support`)
- [ ] **Sitemap** includes all published posts (`/p/[slug]`)
- [ ] **Sitemap** includes all published notes (`/n/[slug]`)
- [ ] **Sitemap** excludes admin routes and `/api/`
- [ ] All internal links use `<a href="...">` elements (crawlable)
- [ ] No broken internal links
- [ ] Redirect `/fund` → `/support` (301 permanent) is working
- [ ] HTTP status codes are correct (200 for content, 301 for redirects, 404 for missing)

See [Crawlable Links](../google/crawling-and-indexing/crawlable-links.md), [Sitemaps](../google/crawling-and-indexing/sitemaps.md), [Robots.txt](../google/crawling-and-indexing/robots-txt.md).

---

## Indexing

- [ ] All public content pages are indexable (`index: true`)
- [ ] Admin routes are noindexed via `X-Robots-Tag: noindex` header
- [ ] Unpublished/draft content returns `noindex, nofollow` in metadata
- [ ] Canonical URLs are set on all content pages (`alternates: { canonical: url }`)
- [ ] No duplicate content accessible via multiple URLs
- [ ] Sitemap contains only canonical URLs
- [ ] `metadataBase` is set correctly in root metadata

See [Canonicalization](../google/crawling-and-indexing/canonicalization.md), [Indexing Control](../google/crawling-and-indexing/indexing-control.md), [Robots Meta Tags](../google/crawling-and-indexing/robots-meta-tags.md).

---

## Search Appearance

### Title tags
- [ ] Every page has a `<title>` element
- [ ] Titles are descriptive and unique per page
- [ ] Title template pattern is used: `%s | Biranchi Kulesika`
- [ ] Home page uses absolute title (not template)
- [ ] No keyword stuffing in titles
- [ ] Titles match the page content

### Meta descriptions
- [ ] Every page has a unique meta description
- [ ] Descriptions are concise (1-2 sentences)
- [ ] Descriptions accurately summarize the page content
- [ ] No duplicate descriptions across pages

### Favicons
- [ ] Favicon is declared in root layout metadata
- [ ] Multiple favicon sizes provided (ICO, SVG, PNG)
- [ ] Apple touch icon is provided
- [ ] Favicon is a square image, at least 48x48px

### Site name
- [ ] `WebSite` structured data is on the home page
- [ ] Site name is consistent across metadata and structured data

### Open Graph / Social
- [ ] OG images are generated for all public pages
- [ ] OG images use correct dimensions (1200x630)
- [ ] OG type is set appropriately (`website` for pages, `article` for posts)
- [ ] Twitter card type is `summary_large_image`
- [ ] Twitter creator handle is set (`@BKulesika`)
- [ ] Social preview images include page-specific content

See [Title Links](../google/metadata/title-links.md), [Snippets](../google/metadata/snippets.md), [Favicon](../google/metadata/favicon.md), [Open Graph](../google/metadata/open-graph-social.md).

---

## Content Quality

- [ ] All content is people-first (written for humans, not search engines)
- [ ] Content demonstrates expertise and first-hand experience
- [ ] Titles accurately describe the content
- [ ] Pages are well-organized with headings and paragraphs
- [ ] Images have descriptive alt text
- [ ] No duplicate or thin content
- [ ] Content is up-to-date (no stale dates or outdated information)
- [ ] If AI tools are used in content creation, the work meets Search Essentials standards

See [Creating Helpful Content](../google/fundamentals/creating-helpful-content.md), [AI Content Guidance](../google/fundamentals/ai-content-guidance.md).

---

## Structured Data

- [ ] `WebSite` JSON-LD on home page (with `name`, `url`, `author`)
- [ ] `Article` JSON-LD on blog post pages (with `headline`, `datePublished`, `dateModified`, `author`, `image`)
- [ ] `Article` JSON-LD on note pages (with `headline`, `datePublished`, `author`)
- [ ] `BreadcrumbList` JSON-LD on content pages
- [ ] `safeJsonLd()` is used to prevent XSS via `</script>` injection
- [ ] Structured data is validated with Rich Results Test
- [ ] All required properties are present for each schema type

See [Structured Data Introduction](../google/structured-data/introduction.md), [Article](../google/structured-data/article.md), [Breadcrumb](../google/structured-data/breadcrumb.md), [Person/WebSite](../google/structured-data/person-website.md).

---

## Performance

- [ ] Core Web Vitals are monitored (Vercel Speed Insights)
- [ ] LCP is under 2.5 seconds
- [ ] INP is under 200 milliseconds
- [ ] CLS is under 0.1
- [ ] Images use modern formats (AVIF, WebP)
- [ ] Fonts use `display: swap` to prevent FOIT
- [ ] No excessive third-party scripts
- [ ] No intrusive interstitials or popups

See [Page Experience](../google/performance/page-experience.md), [Core Web Vitals](../google/performance/core-web-vitals.md).

---

## Internal Linking

- [ ] Navigation links connect all major sections
- [ ] Footer links provide secondary navigation
- [ ] Anchor text is descriptive (not "click here")
- [ ] Important pages are reachable within 3 clicks from homepage
- [ ] Breadcrumb structured data reflects the site hierarchy
- [ ] Internal links use consistent URL patterns

See [Sitelinks](../google/internal-linking/sitelinks.md), [Anchor Text](../google/internal-linking/anchor-text.md).

---

## Security & Headers

- [ ] HTTPS is enforced (HSTS header with `max-age=63072000`)
- [ ] `X-Content-Type-Options: nosniff` is set
- [ ] `X-Frame-Options: DENY` is set
- [ ] `Referrer-Policy: strict-origin-when-cross-origin` is set
- [ ] `Permissions-Policy` restricts unnecessary APIs

---

## Monitoring

- [ ] Google Search Console is set up for the site
- [ ] Sitemap is submitted to Search Console
- [ ] URL Inspection tool is used to verify Google's view of pages
- [ ] Core Web Vitals report is checked periodically
- [ ] Indexing status is monitored (Page Indexing report)
- [ ] Search performance is reviewed periodically

See [Getting Started with Search Console](../google/search-console/getting-started.md), [Debugging](../google/search-console/debugging.md).
