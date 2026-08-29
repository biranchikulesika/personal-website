# Core Web Vitals

Core Web Vitals are a set of metrics that measure real-world user experience for loading performance, interactivity, and visual stability.

## What Google says

### The three metrics

| Metric | What it measures | Good threshold |
|--------|-----------------|----------------|
| **LCP** (Largest Contentful Paint) | Loading performance | ≤ 2.5 seconds |
| **INP** (Interaction to Next Paint) | Responsiveness | ≤ 200 milliseconds |
| **CLS** (Cumulative Layout Shift) | Visual stability | ≤ 0.1 |

### How to measure

- **Search Console**: Core Web Vitals report shows field data for your pages
- **PageSpeed Insights**: Tests individual pages (uses Lighthouse + field data)
- **Chrome DevTools**: Performance panel for detailed analysis
- **web.dev/vitals**: Overview of all metrics and tools

### Important notes

- Good CWV scores don't guarantee top rankings
- CWV scores are meant to improve user experience overall
- Focus on real user experience, not just metric optimization

## What this means for this website

### Current monitoring

Vercel Speed Insights (`@vercel/speed-insights/next`) is integrated in the root layout:

```tsx
import { SpeedInsights } from '@vercel/speed-insights/next';
// ...
<SpeedInsights />
```

This provides real-user monitoring data in the Vercel dashboard.

### Potential concerns

- **LCP**: The home page has a hero image. Ensure it loads quickly.
- **CLS**: The library page shuffles books on each load, which could cause layout shift.
- **INP**: The mobile menu involves client-side state changes. Should be fast since it's simple.

### When to check

- After deploying significant changes
- When adding new heavy components (images, embedded content)
- When experiencing slow page loads

## Checklist

- [ ] LCP is under 2.5 seconds
- [ ] INP is under 200 milliseconds
- [ ] CLS is under 0.1
- [ ] Check Core Web Vitals report in Search Console
- [ ] Check Vercel Speed Insights dashboard

## Source

Google Search Central:
[Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals)
