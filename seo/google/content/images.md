# Image SEO

Images can drive traffic through Google Images and enhance your content's appearance in search results.

## What Google says

### Best practices

1. **Use descriptive alt text** — explains what the image shows
2. **Place images near relevant text** — context helps Google understand the image
3. **Use descriptive file names** — `my-essay-cover.jpg` is better than `IMG_001.jpg`
4. **Use modern formats** — WebP and AVIF for better compression
5. **Provide multiple image sizes** — for responsive display
6. **Use the `alt` attribute** — required for accessibility and SEO

### Alt text guidelines

- Describe the image accurately and concisely
- Include relevant context from the surrounding content
- Don't start with "image of" or "photo of" — it's redundant
- Keep it under 125 characters when possible

## What this means for this website

### Current implementation

This site uses Next.js `Image` component with:
- Automatic format optimization (AVIF, WebP)
- Responsive sizing
- Remote image patterns for external sources

### Image sources

- Profile/atmosphere photos: Local files in `/public`
- Book covers: External URLs (Unsplash, etc.)
- OG images: Dynamically generated via `/api/og`

### When adding images

- Add descriptive `alt` text to all content images
- Use descriptive file names for local images
- Ensure images are relevant to surrounding content
- Don't use images as the sole means of conveying information

## Checklist

- [ ] All images have descriptive `alt` text
- [ ] Image file names are descriptive (not auto-generated)
- [ ] Images are relevant to surrounding content
- [ ] Modern image formats are used (WebP, AVIF)
- [ ] Images are appropriately sized (not oversized)

## Source

Google Search Central:
[Google Images best practices](https://developers.google.com/search/docs/appearance/google-images)
