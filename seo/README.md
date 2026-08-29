# SEO Knowledge Base

This directory is the SEO reference manual for this website. It is designed to be used by both the AI coding agent (as a source of truth for SEO-related changes) and the developer (as a readable guide for SEO decisions).

## What this is

- A curated, project-specific SEO handbook based primarily on **Google Search Central** documentation.
- Organized around how a developer actually thinks about SEO, not Google's internal taxonomy.
- Focused on what matters for a personal website with essays, notes, a library, scribbles, and support pages.

## What this is not

- A copy of Google Search Central documentation. Irrelevant material has been intentionally removed.
- Generic SEO advice from random blogs. Google Search Central remains the primary source.
- An exhaustive reference for every possible Google Search feature.

## How the guide is organized

### `google/` — Google Search guidance

Rewritten, concise versions of Google Search Central documentation, organized by topic:

| Area | Directory | What it covers |
|------|-----------|----------------|
| [Fundamentals](google/fundamentals/) | Core concepts | How search works, SEO basics, content quality, AI guidance |
| [Crawling & Indexing](google/crawling-and-indexing/) | Discovery | Crawling, indexing, canonicalization, redirects, sitemaps, robots |
| [Metadata](google/metadata/) | Search appearance | Titles, snippets, dates, favicons, Open Graph, social meta |
| [Structured Data](google/structured-data/) | Rich results | JSON-LD, Article, Breadcrumb, Person/WebSite schemas |
| [Content](google/content/) | Content quality | Helpful content, images, video |
| [Performance](google/performance/) | Page experience | Core Web Vitals, page experience signals |
| [Internal Linking](google/internal-linking/) | Link structure | Sitelinks, anchor text, information architecture |
| [Policies](google/policies/) | Rules | Spam policies, technical requirements |
| [Search Console](google/search-console/) | Monitoring | Setup, debugging, performance tracking |

### `site/` — Project-specific guidance

How SEO works in this particular codebase:

| File | Purpose |
|------|---------|
| [seo-architecture.md](site/seo-architecture.md) | Site structure, routes, and architecture |
| [seo-checklist.md](site/seo-checklist.md) | Actionable SEO checklist for this website |
| [implementation-notes.md](site/implementation-notes.md) | How SEO is implemented in the codebase |

## How to use this guide

### When making SEO-related code changes

1. Check [site/implementation-notes.md](site/implementation-notes.md) to understand the current implementation.
2. Consult the relevant Google guidance in `google/` for best practices.
3. Use [site/seo-checklist.md](site/seo-checklist.md) to verify nothing was missed.

### When making SEO decisions

1. Start with [site/seo-checklist.md](site/seo-checklist.md) for an overview of what to check.
2. Read the relevant Google guidance for the specific topic.
3. Distinguish between **Google requirements** (things Google explicitly mandates or recommends) and **project recommendations** (suggestions tailored to this website).

## Google guidance vs. project recommendations

Throughout this guide, documents use clear sections to distinguish:

- **What Google says** — The actual requirement, recommendation, or policy from Google's documentation.
- **What this means for this website** — The practical interpretation for this project.
- **Implementation** — What the developer should actually do in the codebase.
- **Checklist** — A short list of things to verify.

Do not treat project recommendations as Google requirements, and do not ignore Google requirements because they aren't mentioned as project recommendations.

## Source attribution

Each Google-derived document preserves a source section linking to the original Google Search Central documentation. Google's documentation changes over time; check the source URLs when guidance needs updating.

## Maintaining this guide

- This documentation is manually maintained. There is no automated sync with Google Search Central.
- When updating, preserve the source URLs so the original guidance can be checked.
- The goal is accuracy, relevance, and practical usefulness — not comprehensiveness.
- If Google releases new guidance relevant to this project, add it. If existing guidance becomes outdated, update or remove it.

## Quick reference: SEO checklist

See [site/seo-checklist.md](site/seo-checklist.md) for the full checklist. Key areas:

- ✅ Robots.txt allows crawling of public content, blocks `/api/`
- ✅ Dynamic sitemap includes all public pages and content
- ✅ Canonical URLs set on all content pages
- ✅ Title tags use `template` pattern with site name
- ✅ Meta descriptions provided for every page
- ✅ Open Graph images generated dynamically for all pages
- ✅ Twitter Card metadata configured
- ✅ Structured data (JSON-LD) for WebSite, Article, Breadcrumb
- ✅ Admin routes blocked with `X-Robots-Tag: noindex`
- ✅ HTTPS enforced with HSTS headers
- ✅ Mobile-first responsive design
- ✅ Core Web Vitals monitored via Vercel Speed Insights
