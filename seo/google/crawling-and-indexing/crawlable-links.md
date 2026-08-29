# Crawlable Links

Google uses links to discover new pages and as a signal for page relevance. Links must be crawlable for Google to follow them.

## What Google says

### Crawlable links

Google can only crawl links that are `<a>` HTML elements with an `href` attribute:

```html
<!-- ✅ Crawlable -->
<a href="/about">About</a>
<a href="https://example.com/page">Page</a>

<!-- ❌ Not crawlable -->
<a onclick="goTo('/about')">About</a>
<span href="/about">About</span>
```

JavaScript-inserted links are crawlable as long as they use standard `<a href="...">` markup in the rendered DOM.

### Anchor text

Anchor text (the visible text of a link) tells Google what the linked page is about:

- **Good**: `<a href="/ghost-peppers">ghost peppers</a>` — descriptive and concise
- **Bad**: `<a href="/page">Click here</a>` — generic, unhelpful
- **Bad**: `<a href="/page"></a>` — empty link text

For image links, the `alt` attribute of the `<img>` serves as anchor text.

### Best practices

- Use descriptive, concise anchor text
- Avoid generic text like "click here" or "read more"
- Ensure every page is reachable through at least one crawlable link
- Link to canonical URLs, not duplicate URLs

## What this means for this website

This site uses Next.js `<Link>` components which render as standard `<a>` elements:

```tsx
<Link href="/about">About</Link>
// Renders as: <a href="/about">About</a>
```

Navigation, footer, and content links are all crawlable by default.

### Internal linking structure

- **Navbar**: Links to Home, About, Library, Scribble, Now, Support
- **Footer**: Links organized in columns (Writing, Explore, Connect)
- **Content links**: Posts link to related posts, notes, and books

## Checklist

- [ ] All internal links use `<a href="...">` elements
- [ ] Anchor text is descriptive and relevant
- [ ] No generic "click here" or "read more" link text
- [ ] Every page is reachable from at least one other page
- [ ] Links point to canonical URLs

## Source

Google Search Central:
[Make your links crawlable](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)
