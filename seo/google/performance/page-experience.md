# Page Experience

Google's ranking systems reward content that provides a good page experience.

## What Google says

### Self-assessment questions

- Do your pages have good Core Web Vitals?
- Are your pages served over HTTPS?
- Does your content display well on mobile devices?
- Does your content avoid excessive distracting ads?
- Do your pages avoid intrusive interstitials?
- Can visitors easily distinguish main content from other elements?

### What matters for ranking

- **Core Web Vitals** are used by ranking systems
- Other page experience aspects (HTTPS, mobile-friendly, no intrusive interstitials) don't directly help ranking, but contribute to a satisfying user experience
- Page experience is evaluated on a **page-specific** basis
- Google always seeks to show the most relevant content, even if page experience is sub-par

### Key principle

Don't focus on only one or two aspects. Check for overall great page experience across many dimensions.

## What this means for this website

### Current implementation

- ✅ **HTTPS**: Enforced with HSTS headers
- ✅ **Mobile-friendly**: Responsive Tailwind CSS layout
- ✅ **No intrusive interstitials**: No popups or modals blocking content
- ✅ **Fast loading**: Vercel edge network, image optimization, font optimization
- ✅ **Core Web Vitals monitoring**: Vercel Speed Insights integrated
- ✅ **No excessive ads**: No ads on the site at all

### Font loading

Fonts use `display: 'swap'` to prevent Flash of Invisible Text:
- Space Grotesk (sans-serif, UI elements)
- Newsreader (serif, long-form prose)

## Checklist

- [ ] HTTPS is enforced
- [ ] Pages load quickly (check Core Web Vitals)
- [ ] Content displays well on mobile
- [ ] No intrusive interstitials
- [ ] No excessive third-party scripts
- [ ] Main content is easily distinguishable

## Source

Google Search Central:
[Page experience](https://developers.google.com/search/docs/appearance/page-experience)
