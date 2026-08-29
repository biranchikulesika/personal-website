# SEO Starter Guide

The essentials of improving how your site appears in Google Search.

## Help Google find your content

Google finds pages through links. To ensure discovery:

1. **Submit a sitemap**: Declare all important URLs in `sitemap.xml`
2. **Make links crawlable**: Use `<a href="...">` elements, not JavaScript-based navigation
3. **Link internally**: Connect your pages through navigation and content links

See [Sitemaps](../crawling-and-indexing/sitemaps.md), [Crawlable Links](../crawling-and-indexing/crawlable-links.md).

## Organize your site

- **Use descriptive URLs**: `/p/my-essay-title` is better than `/p/123`
- **Group related content**: Posts under `/p/`, notes under `/n/`
- **Reduce duplicate content**: Ensure each piece of content is accessible through one canonical URL

See [Canonicalization](../crawling-and-indexing/canonicalization.md).

## Write good titles and descriptions

- **Title**: Every page needs a unique, descriptive `<title>` element. The title is the primary piece of information people use to decide which result to click.
- **Meta description**: A concise summary of the page content. Google sometimes uses it for the search snippet.

See [Title Links](../metadata/title-links.md), [Snippets](../metadata/snippets.md).

## Make your site interesting and useful

Content quality is the most impactful factor:

- Write content that is easy to read, well-organized, and free of errors
- Create unique content — don't copy others
- Keep content up-to-date
- Write for people first, search engines second

See [Creating Helpful Content](creating-helpful-content.md).

## Add images with alt text

- Use high-quality images near relevant text
- Add descriptive alt text to every image
- Use modern image formats (WebP, AVIF)

See [Image SEO](../content/images.md).

## Things not to worry about

Google says these don't matter for ranking:

- **Meta keywords tag**: Google doesn't use it
- **Keyword stuffing**: Repeated words make results look spammy
- **Exact word count**: No magic word count target
- **Heading order**: Semantic order helps screen readers but doesn't affect ranking
- **E-E-A-T as a ranking factor**: It's not a direct ranking factor (though content quality matters)

## What this means for this website

This site already implements most starter guide basics:
- ✅ Descriptive URLs (`/p/slug`, `/n/slug`)
- ✅ Title template with site name
- ✅ Meta descriptions on all pages
- ✅ Sitemap with all content
- ✅ Internal linking via navigation and footer
- ✅ Canonical URLs on all pages

## Checklist

- [ ] Every page has a unique, descriptive title
- [ ] Every page has a unique meta description
- [ ] All internal links are crawlable `<a>` elements
- [ ] Images have descriptive alt text
- [ ] Content is well-organized with headings

## Source

Google Search Central:
[SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
