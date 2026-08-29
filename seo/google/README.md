# Google Search Central Documentation

This directory contains curated, rewritten versions of Google Search Central documentation relevant to this project.

## Source

All material is derived from [Google Search Central](https://developers.google.com/search/docs), the official documentation for Google Search. Each document preserves a source link to the original.

## What was kept

The following topics were retained because they are relevant to this personal website:

- **Fundamentals**: How search works, SEO starter guide, content quality, AI content guidance
- **Crawling & Indexing**: Canonicalization, redirects, robots.txt, robots meta tags, crawlable links, JavaScript SEO, sitemaps, indexing control
- **Metadata**: Title links, meta descriptions, publication dates, favicons, site names, Open Graph
- **Structured Data**: JSON-LD basics, general guidelines, Article, Breadcrumb, Person/WebSite schemas
- **Content**: Helpful content guidelines, images, video
- **Performance**: Page experience, Core Web Vitals
- **Internal Linking**: Sitelinks, anchor text
- **Policies**: Spam policies, technical requirements
- **Search Console**: Getting started, debugging

## What was removed

The following topics were removed because they are not relevant to this project:

- **E-commerce**: Product structured data, merchant listings, product variants, shopping features, return/shipping policies, loyalty programs
- **Business features**: Local business, employer ratings, hotel features, vacation rentals, courses
- **News**: News-specific features, Google News, news sitemaps
- **Specialized content**: Recipes, job postings, math solvers, education Q&A, discussion forums, movies, software apps, datasets
- **AMP**: Accelerated Mobile Pages (deprecated technology)
- **Web Stories**: Not applicable to this project
- **International/multilingual SEO**: This is a single-language English site
- **Large site management**: Crawl budget management for millions of pages
- **Security monitoring**: Malware, social engineering, safe browsing (these are infrastructure concerns, not SEO)
- **Package tracking, carousels, flexible sampling**: Not applicable

## Directory structure

```
google/
├── fundamentals/
│   ├── how-search-works.md
│   ├── seo-starter-guide.md
│   ├── creating-helpful-content.md
│   ├── ai-content-guidance.md
│   └── evaluating-seo-advice.md
├── crawling-and-indexing/
│   ├── canonicalization.md
│   ├── redirects.md
│   ├── robots-txt.md
│   ├── robots-meta-tags.md
│   ├── crawlable-links.md
│   ├── javascript-seo.md
│   ├── sitemaps.md
│   └── indexing-control.md
├── metadata/
│   ├── title-links.md
│   ├── snippets.md
│   ├── publication-dates.md
│   ├── favicon.md
│   ├── site-name.md
│   └── open-graph-social.md
├── structured-data/
│   ├── introduction.md
│   ├── general-guidelines.md
│   ├── article.md
│   ├── breadcrumb.md
│   └── person-website.md
├── content/
│   ├── helpful-content.md
│   ├── images.md
│   └── video.md
├── performance/
│   ├── page-experience.md
│   └── core-web-vitals.md
├── internal-linking/
│   ├── sitelinks.md
│   └── anchor-text.md
├── policies/
│   ├── spam-policies.md
│   └── technical-requirements.md
└── search-console/
    ├── getting-started.md
    └── debugging.md
```

## How to use these docs

Each document follows a consistent structure:

1. **What Google says** — The actual guidance from Google Search Central
2. **What this means for this website** — Practical interpretation
3. **Implementation** — What to do in the codebase
4. **Checklist** — Quick verification items
5. **Source** — Link to the original Google documentation
