# Favicon in Search Results

A favicon can appear next to your site name in Google Search results, helping users quickly identify your site.

## What Google says

### Requirements

- Favicon must be a square (1:1 aspect ratio), at least 8x8px (recommend 48x48+)
- Supported formats: BMP, GIF, ICO, PNG, JPEG, PPM, TIFF
- Favicon URL must be stable (don't change frequently)
- Googlebot-Image must be able to crawl the favicon
- Only one favicon per site (domain/subdomain level)
- The home page must declare the favicon via `<link>` tag

### How to declare

```html
<link rel="icon" href="/favicon.ico">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```

## What this means for this website

### Current implementation

Favicons are declared in root metadata (`lib/seo.ts`):

```typescript
icons: {
  icon: [
    { url: '/favicon/favicon.ico' },
    { url: '/favicon/favicon.svg', type: 'image/svg+xml' },
    { url: '/favicon/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
  ],
  apple: [
    { url: '/favicon/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
  ],
  shortcut: '/favicon/favicon.ico',
},
```

The web app manifest (`app/manifest.ts`) also declares icons for PWA support.

### Favicon files

All favicon files are served from `/favicon/` with cross-origin access headers to ensure social media crawlers can fetch them.

## Checklist

- [ ] Favicon is declared in root layout metadata
- [ ] Multiple formats provided (ICO, SVG, PNG)
- [ ] Apple touch icon is provided
- [ ] Favicon files are accessible (not blocked by robots.txt)
- [ ] Favicon is visually representative of the site

## Source

Google Search Central:
[Favicon in search results](https://developers.google.com/search/docs/appearance/favicon-in-search)
