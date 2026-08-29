# Redirects and Google Search

Redirects resolve one URL to another, telling both users and Google that content has moved.

## What Google says

### Redirect types

| Type | Status codes | Google's behavior |
|------|-------------|-------------------|
| **Permanent** | 301, 308 | Shows the redirect **target** in search results. The target becomes canonical. |
| **Temporary** | 302, 303, 307 | Shows the **source** URL in search results. The source remains canonical. |

### Best practices

- Use **server-side redirects** whenever possible (most reliable)
- Use **301** for permanent moves
- Use **302** for temporary redirects
- Avoid JavaScript redirects (Google may not always render them)
- Avoid meta refresh redirects when server redirects are possible

### Common use cases

- **Domain migration**: 301 redirect all old URLs to new domain
- **URL changes**: 301 redirect old URL to new URL
- **Canonicalization**: 301 redirect non-preferred URLs to canonical
- **Merging content**: 301 redirect deprecated pages to relevant replacements

## What this means for this website

### Current redirects

This site has one redirect configured in `next.config.ts`:

```typescript
redirects: async () => [
  { source: '/fund', destination: '/support', permanent: true },
]
```

This is a 301 permanent redirect from the old `/fund` URL to `/support`.

### When to add redirects

- If a content URL changes (e.g., renaming a post slug)
- If a page is removed and has a logical replacement
- If content moves to a different URL pattern

### Implementation in Next.js

Use the `redirects` config in `next.config.ts`:

```typescript
redirects: async () => [
  { source: '/old-path', destination: '/new-path', permanent: true },
]
```

For dynamic redirects based on content, consider middleware or server-side logic.

## Checklist

- [ ] Old URLs redirect to new URLs with 301
- [ ] No redirect chains (A → B → C; should be A → C)
- [ ] No redirect loops
- [ ] Redirects are server-side, not JavaScript-based
- [ ] Redirected pages are not in the sitemap

## Source

Google Search Central:
[Redirects and Google Search](https://developers.google.com/search/docs/crawling-indexing/301-redirects)
