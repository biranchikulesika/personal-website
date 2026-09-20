# Routing and Page Architecture

The platform uses the Next.js App Router with route groups, dynamic parameters, static pre-rendering, and clear server/client boundaries.

---

## 1. Route Organization

```text
app/
├── (site)/               # Route Group: Public Website
│   ├── about/            # /about
│   ├── library/          # /library (Reading catalog)
│   ├── n/[slug]/         # /n/:slug (Atomic notes)
│   ├── now/              # /now (Living focus timeline)
│   ├── p/[slug]/         # /p/:slug (Long-form essays)
│   ├── scribble/         # /scribble (Aggregated essays and notes feed)
│   ├── support/          # /support (Patronage ledger)
│   ├── layout.tsx        # Public layout wrapper (Header, Nav, Main, Footer)
│   └── page.tsx          # Homepage
├── admin/                # Route Group: Administrative CMS
│   ├── auth/callback/    # /admin/auth/callback (OAuth code exchange)
│   ├── compose/          # /admin/compose (MDX composition workspace)
│   ├── login/            # /admin/login (Admin login)
│   ├── actions.ts        # Server Actions for admin operations
│   ├── layout.tsx        # Admin layout wrapper (noindex)
│   └── page.tsx          # /admin (Dashboard)
├── api/                  # Route Group: Backend Endpoints
│   ├── contributions/    # POST/GET contribution confirmation and history
│   ├── login-background/ # GET dynamic wallpaper for admin login
│   ├── newsletter/       # POST newsletter subscription
│   ├── og/               # GET dynamic Open Graph social images
│   └── webhooks/razorpay # POST Razorpay webhook receiver
├── layout.tsx            # Root HTML layout and fonts
├── not-found.tsx         # Root 404 handler
└── error.tsx             # Root runtime error boundary
```

---

## 2. Static Pre-Rendering (SSG)

Dynamic routes pre-generate static pages at build time using `generateStaticParams()`:

### Essay Route (`app/(site)/p/[slug]/page.tsx`)
```typescript
// 1. Pre-generate all published essay slugs during build
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd(post)) }}
      />
      <BlogPostView post={post} />
    </>
  );
}
```

The atomic note route (`app/(site)/n/[slug]/page.tsx`) follows the identical pattern for notes using `getNoteSlugs()`.

---

## 3. Server versus Client Components

To maintain fast initial page loads and small client JavaScript bundles:
- **Server Components (Default)**:
  All `page.tsx` and `layout.tsx` files are async Server Components. They load data on the server, prepare JSON-LD schemas, and stream pre-rendered HTML to the browser.
- **Client Components (`'use client'`)**:
  Used only where interactive state, DOM event listeners, or client-side filtering are required. Examples include `Navbar` (mobile menu toggle), `ScribblePage` (client-side text and persona filtering), and `ComposeWorkspace` (live preview and editor state).

---

## 4. Redirects and Error Boundaries

- **`/fund` Redirect**: `next.config.ts` configures a permanent HTTP 308 redirect from `/fund` to `/support`.
- **404 Not Found (`app/not-found.tsx`)**: Invoked by Next.js `notFound()`. Injects `robots: { index: false, follow: false }` to prevent indexing of dead URLs.
- **Runtime Errors (`app/error.tsx`, `app/(site)/error.tsx`)**: Catches unexpected runtime exceptions and provides a recovery button to retry without a full page reload.
