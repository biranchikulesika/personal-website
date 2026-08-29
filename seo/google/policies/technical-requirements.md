# Technical Requirements

The bare minimum technical requirements for a page to be eligible for Google Search.

## What Google says

### Minimum technical requirements

For a page to be shown in Google Search, it must:

1. **Be crawlable** — Googlebot must be able to access the page
2. **Not be blocked by robots.txt** (unless you want it hidden, but then use noindex instead)
3. **Not have a noindex tag** (if you want it indexed)
4. **Use valid HTML** — the page must have parseable HTML
5. **Be accessible** — no login requirement for public content

### What Google can index

Google can index:
- HTML pages
- PDF files
- Images (with alt text)
- Videos (with metadata)
- Various other file types

Google cannot reliably index:
- Content requiring plugins (Flash, Java applets)
- Canvas-rendered content
- Content only in videos (text in video is invisible to crawlers)
- Content in CSS `content` property

### HTTPS recommendation

Google recommends HTTPS. Sites using HTTP may be marked as "not secure" in Chrome. HTTPS is a lightweight ranking signal.

## What this means for this website

This site meets all technical requirements:
- ✅ All content is rendered as HTML (Next.js SSR/SSG)
- ✅ HTTPS is enforced with HSTS
- ✅ No plugins required
- ✅ No login required for public content
- ✅ Valid HTML structure
- ✅ Content is in the DOM, not in CSS

## Checklist

- [ ] All public pages are crawlable
- [ ] No accidental robots.txt blocks on public content
- [ ] HTTPS is enforced
- [ ] HTML is valid
- [ ] Content is in the DOM (not hidden in CSS/JS)

## Source

Google Search Central:
[Technical requirements](https://developers.google.com/search/docs/essentials/technical)
