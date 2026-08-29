# Publication Dates (Byline Dates)

Google can show dates in search results when it can determine when a page was published or updated.

## What Google says

### How Google determines dates

Google looks at multiple factors:
- Visible date on the page
- Structured data (`datePublished`, `dateModified`)
- Date in the URL (less reliable)
- Other page signals

### How to provide date information

1. **Show a visible date on the page** — label it clearly ("Published", "Last updated")
2. **Add structured data** — use `datePublished` and `dateModified` in Article schema

### Best practices

- Provide dates in ISO 8601 format in structured data
- Make visible dates and structured data consistent
- Don't specify future dates
- Don't change dates to make content seem fresh when it hasn't changed
- Provide timezone information for precision

## What this means for this website

### Current implementation

Blog posts include dates in their structured data:

```typescript
// lib/seo.ts — articleJsonLd()
datePublished: post.publishedAt,
dateModified: post.lastEditedAt || post.publishedAt,
```

Posts also have `publishedAt` and `lastEditedAt` fields in their metadata:

```typescript
// lib/seo.ts — postMetadata()
openGraph: {
  publishedTime: post.publishedAt,
  modifiedTime: post.lastEditedAt,
}
```

### Dates in the sitemap

The sitemap uses `lastModified` from post/note data:

```typescript
lastModified: new Date(post.lastEditedAt || post.publishedAt),
```

### Important

- Dates should reflect actual publication and modification dates
- Don't update `lastEditedAt` for trivial changes (formatting, typo fixes)
- Only update it for substantive content changes

## Checklist

- [ ] Posts have `publishedAt` dates
- [ ] Posts have `lastEditedAt` dates (updated when content changes substantively)
- [ ] Structured data includes `datePublished` and `dateModified`
- [ ] Open Graph metadata includes `publishedTime` and `modifiedTime`
- [ ] Visible dates on pages match structured data dates

## Source

Google Search Central:
[Influence byline dates](https://developers.google.com/search/docs/appearance/publication-dates)
