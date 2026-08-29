# Anchor Text Best Practices

Anchor text (the visible text of a link) tells both users and Google what the linked page is about.

## What Google says

### Good anchor text

- **Descriptive**: Tells the user what they'll find on the linked page
- **Concise**: Short enough to be scannable but long enough to be meaningful
- **Relevant**: Related to both the current page and the linked page

### Bad anchor text

- **"Click here"** or **"Read more"** — generic, tells nothing about the destination
- **Empty link text** — completely unhelpful
- **Too long** — excessively verbose anchor text is hard to scan
- **Keyword-stuffed** — repeating the same keywords unnaturally

### Examples

**Bad**:
```html
<a href="/about">Click here</a>
<a href="/library">Read more about my reading</a>
```

**Good**:
```html
<a href="/about">About Biranchi Kulesika</a>
<a href="/library">Library — books I've read and recommend</a>
```

### For image links

The `alt` attribute of an image used as a link serves as anchor text:
```html
<a href="/about"><img src="photo.jpg" alt="Biranchi Kulesika"></a>
```

## What this means for this website

### Current implementation

Navigation links use descriptive labels:
- "About" → `/about`
- "Library" → `/library`
- "Scribble" → `/scribble`
- "Now" → `/now`
- "Support" → `/support`

Footer links use descriptive labels organized by category.

### When adding new links

- Use meaningful text that describes the destination
- Avoid generic phrases
- Keep it concise — one short phrase is ideal
- For content links, use the title or key concept of the linked content

## Checklist

- [ ] All links have descriptive anchor text
- [ ] No "click here" or "read more" link text
- [ ] Anchor text is concise and relevant
- [ ] Image links have descriptive alt text

## Source

Google Search Central:
[Make your links crawlable](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)
