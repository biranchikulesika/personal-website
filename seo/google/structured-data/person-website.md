# Person and WebSite Structured Data

For personal websites, `WebSite` and `Person` structured data on the home page helps Google understand who owns the site and what it's about.

## What Google says

### WebSite schema

Required properties:
- `name`: The site name
- `url`: The canonical home page URL

Recommended properties:
- `alternateName`: Alternative names for the site
- `description`: Brief site description
- `inLanguage`: Primary language
- `author`: The person or organization behind the site

### Person schema

Used as the `author` of the `WebSite`. Recommended properties:
- `name`: Person's name
- `url`: Link to a page about the person
- `image`: Profile image
- `sameAs`: Links to social media profiles
- `jobTitle`: Professional title
- `knowsAbout`: Areas of expertise

### Knowledge panel eligibility

Proper `Person` structured data with `sameAs` links to authoritative profiles (Wikipedia, social media, official profiles) can help establish a knowledge panel in Google Search.

## What this means for this website

### Current implementation

`websiteJsonLd()` in `lib/seo.ts`:

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Biranchi Kulesika",
  "url": "https://biranchikulesika.com",
  "description": "The personal website of Biranchi Kulesika...",
  "inLanguage": "en-US",
  "image": "https://biranchikulesika.com/favicon/web-app-manifest-512x512.png",
  "author": {
    "@type": "Person",
    "name": "Biranchi Kulesika",
    "url": "https://biranchikulesika.com",
    "image": "https://biranchikulesika.com/favicon/web-app-manifest-512x512.png",
    "jobTitle": "Software Developer & Writer",
    "sameAs": [
      "https://github.com/biranchikulesika",
      "https://x.com/BKulesika",
      "https://linkedin.com/in/biranchikulesika",
      "https://instagram.com/biranchikulesika"
    ],
    "knowsAbout": [
      "Software Engineering",
      "Web Architecture",
      "Cybersecurity",
      "Computer Science",
      "Philosophy"
    ]
  }
}
```

### SameAs links

The `sameAs` property connects the site owner's identity across platforms:
- GitHub (professional work)
- X/Twitter (social)
- LinkedIn (professional)
- Instagram (personal)

These help Google disambiguate the person and potentially establish a knowledge panel.

### Person as publisher

In this site, the `Person` is both the author and publisher of all content. The `publisher` field in Article structured data also references this Person.

## Checklist

- [ ] `WebSite` structured data is on the home page
- [ ] `name` and `url` are present
- [ ] `author` is a `Person` with `name`, `url`, and `sameAs`
- [ ] `sameAs` links are to active, authoritative profiles
- [ ] `knowsAbout` reflects genuine areas of expertise
- [ ] No fabricated or inaccurate information

## Source

Google Search Central:
[Site names](https://developers.google.com/search/docs/appearance/site-names)
[Organization structured data](https://developers.google.com/search/docs/appearance/structured-data/organization)
