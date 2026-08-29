# JavaScript SEO

Websites using JavaScript frameworks need to account for how crawlers process content.

## What Google says

### How Google handles JavaScript

1. Googlebot crawls the HTML
2. Googlebot queues the page for rendering
3. Googlebot renders the page using a recent version of Chrome
4. Google indexes the rendered content

### Common issues

- **Client-side rendering**: If content is only rendered via JavaScript, Google may not see it until rendering occurs
- **JavaScript-rendered links**: Google can follow `<a>` elements inserted by JavaScript, but only if they use standard HTML markup
- **Dynamic content**: Content loaded after user interaction may not be indexed
- **Canonical links via JavaScript**: Prefer setting canonical URLs in HTML source, not via JavaScript

### Best practices

- Use server-side rendering (SSR) or static generation (SSG) when possible
- Ensure important content is in the initial HTML
- Use standard `<a href="...">` for links
- Don't rely on user interaction to reveal content
- Test with URL Inspection tool to see how Google renders your pages

## What this means for this website

This site uses Next.js with:

- **Static Site Generation (SSG)** for posts and notes (`generateStaticParams()`)
- **Server-Side Rendering (SSR)** for pages that fetch data at request time
- **Server Components** (React Server Components) — most components render on the server

This means content is available in the initial HTML response, which is ideal for SEO. Googlebot sees the same content as users without needing to execute client-side JavaScript.

### Client components

The only significant client component is the `Navbar` (`'use client'`). This is acceptable because:
- Navigation links are still standard `<a>` elements
- The main content is server-rendered
- The mobile menu is a UI enhancement, not critical content

### OG images

OG images are generated via the `/api/og` endpoint using Next.js `ImageResponse`. These are served as PNG images with appropriate caching headers, so social media crawlers can fetch them without JavaScript rendering.

## Checklist

- [ ] Critical content is rendered server-side (SSG or SSR)
- [ ] Links use standard `<a href="...">` markup
- [ ] No content requires user interaction to be visible
- [ ] Verify rendering with URL Inspection tool in Search Console

## Source

Google Search Central:
[JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
