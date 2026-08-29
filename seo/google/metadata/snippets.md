# Snippets and Meta Descriptions

The snippet is the description text below the title link in search results. Google generates snippets from page content, but may use the meta description if it's a better summary.

## What Google says

### How snippets work

- Snippets are **automatically created** from page content
- Google sometimes uses the `<meta name="description">` tag if it provides a better summary
- Snippets may differ for different search queries
- You can control snippet length with `max-snippet` robots meta tag
- You can exclude sections from snippets with `data-nosnippet` attribute

### Best practices for meta descriptions

- **Create unique descriptions for each page** — identical descriptions across pages aren't helpful
- **Include relevant information** — descriptions can include author, date, key details
- **Be descriptive, not keyword-stuffed** — a concise summary of the page
- **Match the page content** — don't promise something the page doesn't deliver

### Examples

**Bad**: `<meta name="description" content="Sewing supplies, yarn, colored pencils">`

**Good**: `<meta name="description" content="Get everything you need to sew your next garment. Open Monday-Friday 8-5pm, located in the Fashion District.">`

## What this means for this website

### Current implementation

Each page has a unique meta description set in its metadata function:

| Page | Description |
|------|-------------|
| Home | "The personal website of Biranchi Kulesika. Software, writing, ideas, and things worth sharing." |
| About | "A little about Biranchi Kulesika, his work, writing, interests, and the things he is learning along the way." |
| Library | "Books I've read, loved, and recommend for others to read." |
| Scribble | "Writing and thinking, shared openly." |
| Now | "What I'm reading, exploring, working on, and thinking about these days." |
| Support | "Support my work and help me keep building, writing, and sharing things openly." |
| Posts | Uses `post.description` or `post.subtitle` |
| Notes | Uses `note.subtitle` or `note.description` |

### When creating new content

Every new post and note should have a `description` field that:
- Summarizes the content in 1-2 sentences
- Is unique (not repeated from other content)
- Accurately represents what the page is about

## Checklist

- [ ] Every page has a unique meta description
- [ ] Descriptions are concise (1-2 sentences)
- [ ] Descriptions accurately summarize the page
- [ ] No duplicate descriptions across pages
- [ ] Content pages have `description` fields in their data

## Source

Google Search Central:
[Snippets](https://developers.google.com/search/docs/appearance/snippet)
