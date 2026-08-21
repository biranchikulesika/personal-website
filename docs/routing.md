# Routing & Page Architecture

The platform uses the **Next.js 16 App Router** with route groups, dynamic segment parameters, server-side data fetching, and granular client/server component boundaries.

---

## 1. Route Groups & Organization

```
app/
├── (site)/               # Route Group: Public Facing Pages
│   ├── about/            # /about
│   ├── fund/             # /fund (Redirects to /support)
│   ├── library/          # /library
│   ├── n/[slug]/         # /n/:slug (Atomic Notes)
│   ├── now/              # /now (Living Timeline)
│   ├── p/[slug]/         # /p/:slug (Essays)
│   ├── scribble/         # /scribble (Aggregated Index)
│   ├── support/          # /support (Patronage Ledger)
│   ├── layout.tsx        # Public layout wrapper (Header, Nav, Main, Footer)
│   └── page.tsx          # Homepage
├── admin/                # Route Group: Administrative CMS
│   ├── compose/          # /admin/compose (Full-screen MDX workspace)
│   ├── login/            # /admin/login (Admin authentication)
│   ├── layout.tsx        # Admin layout wrapper (noindex)
│   └── page.tsx          # /admin (Dashboard)
├── api/                  # Route Group: Backend Endpoints
│   ├── contributions/    # POST/GET Payment confirmation
│   ├── login-background/ # GET Dynamic wallpaper
│   ├── og/               # GET Dynamic Open Graph social images
│   └── webhooks/razorpay # POST Razorpay webhook receiver
├── layout.tsx            # Global HTML shell & typography provider
├── not-found.tsx         # Global 404 handler
└── error.tsx             # Global runtime error boundary
```

---

## 2. Dynamic Routes & Static Site Generation (SSG)

Dynamic routes pre-generate static pages at build time using `generateStaticParams()` while supporting on-demand rendering for new content:

### Essay Route (`app/(site)/p/[slug]/page.tsx`)
```typescript
// 1. Pre-generate all published essay slugs at build time
export async function generateStaticParams() {
  const service = new ContentService();
  const slugs = await service.getPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

// 2. Generate per-slug dynamic SEO metadata
export async function generateMetadata({ params }): Promise<Metadata> {
  const { slug } = await params;
  const post = await new ContentService().getPost(slug);
  if (!post) return { title: 'Post not found', robots: { index: false } };
  return postMetadata(post);
}

// 3. Server Component Page Execution
export default async function PostPage({ params }) {
  const { slug } = await params;
  const post = await new ContentService().getPost(slug);
  if (!post) notFound();

  return (
    <>
      <script type="application/ld+json" ... />
      <BlogPostView post={post} />
    </>
  );
}
```

---

## 3. Server vs Client Component Boundaries

To achieve near-instant page loads and minimal JavaScript bundle sizes:
- **Server Components (Default)**:
  - All `page.tsx` and `layout.tsx` files are async Server Components.
  - They execute on the server, fetch data via `ContentService`, generate JSON-LD, and stream static HTML to the client.
- **Client Components (`'use client'`)**:
  - Used exclusively where client-side interactivity, DOM listeners, or animations are required.
  - Examples: `Navbar` (mobile menu toggle), `SupportPageView` (payment modal), `ScribblePage` (client-side search & filtering), `ComposeWorkspace` (editor & live preview).

---

## 4. Error & Not-Found Boundaries

- **`app/not-found.tsx`**: Renders when `notFound()` is invoked. Sets HTTP `robots: { index: false, follow: false }` to prevent search engine indexing of invalid URLs.
- **`app/error.tsx`**: Client-side error boundary with accessible retry action triggers (`ErrorView`).
- **`next.config.ts` Redirects**: Permanent `308` redirect configured from `/fund` to `/support`.
