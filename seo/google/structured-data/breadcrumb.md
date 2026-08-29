# Breadcrumb Structured Data

Breadcrumb structured data tells Google about the hierarchical structure of your site. Breadcrumbs can appear in search results, helping users understand where a page sits in your site.

## What Google says

### Schema type

Use `BreadcrumbList` with `ListItem` elements:

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://example.com/" },
    { "@type": "ListItem", "position": 2, "name": "Section", "item": "https://example.com/section" },
    { "@type": "ListItem", "position": 3, "name": "Page Title" }
  ]
}
```

### Required properties

- `itemListElement`: Array of `ListItem` objects
- Each `ListItem` needs: `position`, `name`, and optionally `item` (URL)

### Guidelines

- Breadcrumbs represent a typical user path, not necessarily the URL structure
- Don't include the domain as a breadcrumb level
- Don't include the current page as a breadcrumb (last item has no `item` URL)
- Follow general structured data guidelines

## What this means for this website

### Current implementation

`breadcrumbJsonLd()` in `lib/seo.ts`:

```typescript
export function breadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}
```

### Breadcrumb structure

| Page | Breadcrumb trail |
|------|-----------------|
| Home | (no breadcrumb — it's the root) |
| About | Home → About |
| Library | Home → Library |
| Scribble | Home → Scribble |
| Now | Home → Now |
| Support | Home → Support |
| Post | Home → Scribble → [Post Title] |
| Note | Home → Scribble → [Note Title] |

### Note on post breadcrumbs

Posts and notes show the breadcrumb "Home → Scribble → [Title]" because they are accessed through the Scribble index. This matches the user's navigation path.

## Checklist

- [ ] BreadcrumbList structured data is on all content pages
- [ ] Position numbers are sequential starting from 1
- [ ] URLs are absolute
- [ ] Last item (current page) doesn't have an `item` URL
- [ ] Breadcrumbs reflect actual user navigation paths

## Source

Google Search Central:
[Breadcrumb structured data](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb)
