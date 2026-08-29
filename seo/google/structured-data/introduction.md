# Structured Data Introduction

Structured data is a standardized format for providing information about a page and classifying its content. It helps Google understand your content and can enable rich results in search.

## What Google says

### Why use structured data

- Enables **rich results** (enhanced search features like star ratings, carousels, knowledge panels)
- Helps Google understand content type, relationships, and meaning
- Can improve click-through rates (case studies show 25-82% higher CTR)

### Supported formats

| Format | Description | Recommendation |
|--------|-------------|----------------|
| **JSON-LD** | JavaScript notation in `<script>` tag | **Recommended** — easiest to implement and maintain |
| Microdata | HTML tag attributes | Supported, but more verbose |
| RDFa | HTML5 extension | Supported, but less common |

### Key guidelines

- Structured data must describe content that is visible on the page
- Don't create blank pages just to hold structured data
- Include all required properties for your chosen schema type
- Validate with [Rich Results Test](https://search.google.com/test/rich-results)
- Follow both general guidelines and type-specific guidelines

### General rules

1. **Don't markup invisible content** — the data should match what users see
2. **Don't use structured data for deceptive purposes**
3. **Keep data accurate and up-to-date**
4. **Use the most specific type** (e.g., `BlogPosting` instead of just `Article`)

## What this means for this website

This site uses JSON-LD structured data for:

| Schema type | Pages | Purpose |
|-------------|-------|---------|
| `WebSite` | Home page | Site identity, author info |
| `Article` | Posts, notes | Content metadata, dates, author |
| `BreadcrumbList` | Content pages | Navigation hierarchy |

All structured data is generated via functions in `lib/seo.ts` and rendered via `<script type="application/ld+json">` tags.

## Checklist

- [ ] Structured data uses JSON-LD format
- [ ] Structured data is validated with Rich Results Test
- [ ] Only visible content is marked up
- [ ] All required properties are present
- [ ] Data is accurate and up-to-date

## Source

Google Search Central:
[Introduction to structured data](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
