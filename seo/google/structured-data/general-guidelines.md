# Structured Data General Guidelines

Rules that apply to all structured data types.

## What Google says

### Technical guidelines

1. **Add structured data to the page the information describes** — don't put it on a different page
2. **When using JSON-LD, place it in the `<head>` or `<body>`** — Google recommends `<head>`
3. **Use valid JSON-LD syntax** — test with schema validator
4. **Don't combine formats** — use either JSON-LD, Microdata, or RDFa, not a mix
5. **Use HTTPS** for all URLs in structured data
6. **Keep data accurate** — don't mark up content that doesn't exist on the page

### Quality guidelines

1. **Don't markup misleading content** — structured data should reflect reality
2. **Don't use structured data for deceptive purposes** — violates spam policies
3. **Keep it up-to-date** — update structured data when content changes
4. **Follow type-specific guidelines** — each schema type has additional requirements

### Content guidelines

1. **The structured data must be visible to users** — don't mark up hidden content
2. **Don't create empty pages** just to hold structured data
3. **Don't use structured data as a substitute for visible content**

### Validation

- Use [Rich Results Test](https://search.google.com/test/rich-results) for validation
- Use [Schema Markup Validator](https://validator.schema.org/) for general validation
- Monitor the Rich Results status report in Search Console after deployment

## What this means for this website

### Current validation approach

1. Structured data is generated server-side in `lib/seo.ts`
2. All JSON-LD is sanitized via `safeJsonLd()` to prevent XSS
3. Structured data should be validated after deployment using Rich Results Test

### Common issues to watch for

- **Missing required properties**: Each schema type has required fields
- **Incorrect date formats**: Must be ISO 8601
- **Mismatched data**: Structured data must match visible page content
- **Stale data**: Update structured data when content changes

## Checklist

- [ ] JSON-LD is valid (no syntax errors)
- [ ] All required properties are present for each schema type
- [ ] Structured data matches visible page content
- [ ] Dates are in ISO 8601 format
- [ ] URLs are absolute and use HTTPS
- [ ] No hidden or misleading content is marked up

## Source

Google Search Central:
[General structured data guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)
