# How Google Search Works

Google Search operates in three stages: **crawling**, **indexing**, and **serving**. Understanding this pipeline helps when debugging why a page isn't appearing in search results.

## The three stages

### 1. Crawling

Google discovers pages by following links and reading sitemaps. The program that does this is called **Googlebot**. Key points:

- Google finds pages through links from other pages it has already crawled
- Sitemaps help Google discover pages that might not be linked from elsewhere
- Googlebot renders JavaScript using a recent version of Chrome
- If Googlebot can't access a page (blocked by robots.txt, requires login, server errors), it won't be crawled

### 2. Indexing

After crawling, Google analyzes the page content and stores it in the Google index. Key points:

- Google processes text, images, video, and metadata
- Google determines if a page is a duplicate of another and picks a **canonical** URL
- Not every crawled page gets indexed — quality and relevance matter
- `noindex` tags prevent indexing even if a page is crawled

### 3. Serving

When a user searches, Google returns results it considers most relevant and high-quality. Key points:

- Relevancy depends on hundreds of factors including user location, language, and device
- Google does not accept payment to rank pages higher
- A page can be indexed but not shown in results if the content is irrelevant or low quality

## What this means for this website

- **Ensure all public content is crawlable**: The sitemap declares all important URLs, and robots.txt allows crawling of public routes.
- **Set canonical URLs**: Each content page sets a canonical URL via `alternates: { canonical }` in metadata.
- **Use structured data**: JSON-LD helps Google understand content type and relationships.
- **Avoid blocking indexing unintentionally**: Admin routes use `X-Robots-Tag: noindex` but public content is fully indexable.

## Checklist

- [ ] Sitemap is accessible at `/sitemap.xml`
- [ ] robots.txt allows crawling of public content
- [ ] No accidental `noindex` on public pages
- [ ] Canonical URLs are set on all content pages
- [ ] Content is rendered server-side (Next.js SSR/SSG), not client-side only

## Source

Google Search Central:
[How Search Works](https://developers.google.com/search/docs/fundamentals/how-search-works)
