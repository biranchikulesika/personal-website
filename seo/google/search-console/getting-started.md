# Getting Started with Google Search Console

Google Search Console is a free tool from Google that helps you monitor and optimize your site's presence in Google Search.

## What Google says

### What Search Console provides

- **Performance reports**: See which queries bring users to your site, click-through rates, and positions
- **Index coverage**: See which pages Google has indexed and any indexing issues
- **URL Inspection**: See exactly how Google sees a specific page
- **Core Web Vitals**: Monitor loading performance metrics
- **Sitemaps**: Submit and monitor your sitemap
- **Manual actions**: See if Google has taken any manual actions against your site
- **Security issues**: See if Google has detected security problems

### Setup steps

1. Go to [Search Console](https://search.google.com/search-console)
2. Add your property (domain or URL prefix)
3. Verify ownership (DNS, HTML file, meta tag, etc.)
4. Submit your sitemap
5. Wait for data to populate (may take a few days)

### Verification methods

For a Vercel-deployed Next.js site, the easiest methods are:
- **HTML meta tag**: Add a verification meta tag to the layout
- **DNS record**: Add a TXT record to your domain

## What this means for this website

### Recommended setup

1. **Verify the site** in Search Console using DNS or meta tag
2. **Submit the sitemap**: `https://[domain]/sitemap.xml`
3. **Check Index coverage** weekly to ensure all public pages are indexed
4. **Monitor Core Web Vitals** to catch performance regressions
5. **Use URL Inspection** when debugging why specific pages aren't appearing in search

### Key reports to check

| Report | Frequency | What to look for |
|--------|-----------|-----------------|
| Performance | Weekly | Top queries, CTR, position changes |
| Index coverage | Weekly | Errors, warnings, excluded pages |
| Core Web Vitals | Monthly | LCP, INP, CLS scores |
| Manual actions | Monthly | Any penalties |
| Sitemaps | After deployment | Successful processing, discovered URLs |

### TODO

The site should be verified in Google Search Console if it isn't already. This is a manual step that requires domain access.

## Checklist

- [ ] Site is verified in Google Search Console
- [ ] Sitemap is submitted
- [ ] No indexing errors in Index Coverage report
- [ ] Core Web Vitals are in "good" range
- [ ] No manual actions

## Source

Google Search Central:
[Search Console](https://developers.google.com/search/docs/monitor-debug/search-console-start)
