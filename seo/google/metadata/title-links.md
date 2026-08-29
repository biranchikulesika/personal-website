# Title Links

The title link is the headline of a search result. It's often the primary piece of information people use to decide which result to click.

## What Google says

### How title links are generated

Google automatically determines title links from multiple sources:
1. `<title>` element (primary source)
2. Main visual title on the page
3. Heading elements (`<h1>`, `<h2>`, etc.)
4. `og:title` meta tag
5. Other prominent text on the page
6. Anchor text from links pointing to the page

### Best practices

- **Every page must have a `<title>` element**
- **Make titles descriptive and concise** — accurately describe the page content
- **Avoid keyword stuffing** — don't repeat the same words multiple times
- **Avoid boilerplate** — don't use the same title template for every page
- **Brand your titles** — include site name, but keep it concise (e.g., "Page Title | Site Name")
- **Use the same language** as the page content

### Common issues Google corrects

- Half-empty titles (e.g., `| Site Name` with missing page title)
- Obsolete titles (dates that haven't been updated)
- Inaccurate titles (don't match page content)
- Duplicate titles across multiple pages

## What this means for this website

### Current implementation

Root metadata in `lib/seo.ts`:
```typescript
title: {
  default: SITE_NAME,           // "Biranchi Kulesika"
  template: `%s | ${SITE_NAME}`, // "Page Title | Biranchi Kulesika"
}
```

Each page overrides with its specific title:
- Home: `{ absolute: SITE_NAME }` — renders as "Biranchi Kulesika" (no suffix)
- About: `"About"` — renders as "About | Biranchi Kulesika"
- Posts: `post.title` — renders as "Post Title | Biranchi Kulesika"

### Title format

| Page | Title |
|------|-------|
| Home | Biranchi Kulesika |
| About | About \| Biranchi Kulesika |
| Library | Library \| Biranchi Kulesika |
| Scribble | Scribble \| Biranchi Kulesika |
| Now | Now \| Biranchi Kulesika |
| Support | Support & Patronage \| Biranchi Kulesika |
| Post | [Post Title] \| Biranchi Kulesika |
| Note | [Note Title] \| Biranchi Kulesika |

### Review checklist for new content

When creating new pages or content:
- Is the title unique and descriptive?
- Does it accurately represent the page content?
- Is it concise (not excessively long)?
- Does it include the site name via the template?

## Checklist

- [ ] Every page has a unique, descriptive `<title>`
- [ ] Titles are not duplicates across pages
- [ ] Titles accurately describe page content
- [ ] No keyword stuffing
- [ ] Title template is applied correctly

## Source

Google Search Central:
[Influencing title links](https://developers.google.com/search/docs/appearance/title-link)
