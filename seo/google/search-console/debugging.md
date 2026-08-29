# Debugging SEO Issues

How to diagnose and fix common SEO problems using Google Search Console and other tools.

## Common issues and solutions

### Page not indexed

**Symptoms**: Page doesn't appear in Google Search, Search Console shows "Excluded" or "Discovered - currently not indexed"

**Checklist**:
1. **URL Inspection tool**: Enter the URL in Search Console to see how Google sees it
2. **Check robots.txt**: Ensure the page isn't blocked from crawling
3. **Check for noindex**: Ensure no `noindex` meta tag or header is present
4. **Check canonical**: Ensure the canonical URL points to the correct page
5. **Check sitemap**: Ensure the page is listed in the sitemap
6. **Check quality**: Google may not index low-quality or thin content

### Title link differs from expected

**Symptoms**: Google shows a different title than the `<title>` element

**Common causes**:
- Half-empty title (e.g., `| Site Name`)
- Title doesn't match page content
- Duplicate titles across pages
- Google found better text on the page

**Fix**: Ensure the `<title>` element is descriptive, unique, and accurate.

### Snippet differs from meta description

**Symptoms**: Google shows different text than the `<meta name="description">`

**This is normal**: Google may generate a better snippet from page content. The meta description is a hint, not a guarantee.

**To improve**: Make the meta description a concise, accurate summary of the page. Google will use it if it's the best available description.

### Rich results not showing

**Symptoms**: Structured data is implemented but rich results don't appear

**Checklist**:
1. Validate with [Rich Results Test](https://search.google.com/test/rich-results)
2. Check for errors in the Rich Results status report
3. Ensure all required properties are present
4. Ensure structured data matches visible content
5. Allow time for re-crawling (days to weeks)

### Traffic drop

**Symptoms**: Sudden decrease in search traffic

**Steps**:
1. Check the Performance report for affected queries/pages
2. Check for manual actions in the Manual Actions report
3. Check for security issues
4. Check if pages were accidentally noindexed
5. Check for server errors (5xx responses)
6. Check if a core update was released (Google Search Central blog)

## Useful tools

| Tool | URL | Purpose |
|------|-----|---------|
| Search Console | search.google.com/search-console | Monitor indexing, performance, issues |
| URL Inspection | In Search Console | See how Google sees a specific page |
| Rich Results Test | search.google.com/test/rich-results | Validate structured data |
| PageSpeed Insights | pagespeed.web.dev | Test Core Web Vitals |
| Schema Validator | validator.schema.org | Validate JSON-LD syntax |

## What this means for this website

### Proactive monitoring

- Check Search Console weekly for indexing issues
- After deploying new content, use URL Inspection to verify Google sees it correctly
- Monitor Core Web Vitals monthly
- After structural changes, check the Index Coverage report

### When making SEO changes

1. Make the change
2. Deploy to production
3. Use URL Inspection → "Request Indexing" for important pages
4. Monitor Search Console for changes over the following weeks

## Checklist

- [ ] URL Inspection tool is used when debugging specific pages
- [ ] Index Coverage report is checked weekly
- [ ] Performance report is reviewed periodically
- [ ] Manual Actions report is checked monthly
- [ ] Core Web Vitals are monitored

## Source

Google Search Central:
[Debugging search traffic drops](https://developers.google.com/search/docs/monitor-debug/debugging-search-traffic-drops)
