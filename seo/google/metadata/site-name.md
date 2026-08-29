# Site Name in Search Results

Google shows a site name alongside search results. This is different from the per-page title link — it identifies the website itself.

## What Google says

### How site names are determined

Google automatically determines site names from:
- `WebSite` structured data on the home page
- `og:site_name` meta tag
- `<title>` element on the home page
- Heading elements and other text on the home page
- External references to the site

### Best practices

- Add `WebSite` structured data to the home page (strongest signal)
- Use a unique, concise, commonly-recognized name
- Keep the name consistent across all sources
- Provide an `alternateName` as fallback

### Technical requirements

- One site name per domain/subdomain
- Structured data must be on the home page (domain root)
- Home page must be crawlable

## What this means for this website

### Current implementation

The home page has `WebSite` structured data (`lib/seo.ts`):

```typescript
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,      // "Biranchi Kulesika"
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: "en-US",
    author: { ... },      // Person with sameAs links
  };
}
```

The `og:site_name` is also set in root metadata:
```typescript
openGraph: {
  siteName: SITE_NAME,   // "Biranchi Kulesika"
}
```

### Site name consistency

The name "Biranchi Kulesika" is used consistently across:
- `WebSite` structured data
- `og:site_name`
- `<title>` template
- Footer branding
- Open Graph images

## Checklist

- [ ] `WebSite` structured data is on the home page
- [ ] Site name is consistent across metadata and structured data
- [ ] `og:site_name` is set in root metadata
- [ ] No conflicting site names in different sources

## Source

Google Search Central:
[Site names](https://developers.google.com/search/docs/appearance/site-names)
