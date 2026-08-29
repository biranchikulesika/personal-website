# Sitelinks and Site Structure

Sitelinks are additional links from your domain that appear under your main search result. They help users navigate directly to important pages.

## What Google says

### How sitelinks work

- Google's systems analyze your link structure to find shortcuts for users
- Sitelinks are **automated** — you can't directly choose which pages appear
- Google only shows sitelinks when they think they'll be useful
- You can't request specific sitelinks

### Best practices for better sitelinks

1. **Use informative, concise page titles** — clear titles help Google identify important pages
2. **Create logical site structure** — organized navigation helps Google find shortcuts
3. **Link to important pages from other relevant pages** — internal linking signals importance
4. **Ensure anchor text is concise and relevant** — helps Google understand what each link leads to
5. **Avoid duplicate content** — unique content per URL helps canonicalization

### Removing unwanted sitelinks

If a sitelink appears that you don't want, you can either:
- Remove the page from your site
- Add `noindex` to the page

## What this means for this website

### Current site structure

```
Home (/)
├── About (/about)
├── Library (/library)
├── Scribble (/scribble)
│   ├── Post (/p/[slug])
│   └── Note (/n/[slug])
├── Now (/now)
└── Support (/support)
```

### Internal linking

- **Navbar**: Links to all major sections from every page
- **Footer**: Links organized in columns (Writing, Explore, Connect)
- **Content**: Posts link to related posts, notes, and books
- **Breadcrumb data**: Home → Section → Content

### What helps sitelinks

- Clean, descriptive URLs (`/about`, `/library`, `/scribble`)
- Consistent navigation across all pages
- Unique titles for each section
- Logical hierarchy with clear parent-child relationships

## Checklist

- [ ] Navigation links to all important sections
- [ ] Page titles are unique and descriptive
- [ ] Site structure is logical and consistent
- [ ] Internal links use descriptive anchor text
- [ ] No duplicate content at different URLs

## Source

Google Search Central:
[Sitelinks](https://developers.google.com/search/docs/appearance/sitelinks)
