# Project Structure

This document outlines the directory structure of the project, explaining the purpose of each folder, what belongs there, and what does not.

```
biranchi/
├── app/                  # Next.js App Router (pages, layouts, routes, API endpoints)
├── components/           # React presentation components & UI primitives
├── docs/                 # Developer documentation
├── lib/                  # Application services, repositories, configurations, domain types
├── public/               # Static images, icons, and public assets
├── scripts/              # Developer & database maintenance scripts
├── tests/                # Automated unit and integration test suite
├── next.config.ts        # Next.js server configuration & headers
├── package.json          # Dependencies & npm scripts
├── proxy.ts              # Route proxy & security boundary middleware
├── supabase/schema.sql   # Idempotent database schema & RLS policies
└── tsconfig.json         # TypeScript compiler configuration
```

---

## Detailed Directory Breakdown

### 1. `app/` — Application Routing & Server Boundaries
Houses Next.js 16 App Router pages, server layouts, metadata generators, and API route handlers.

```
app/
├── (site)/               # Public website route group (inherits SiteLayout)
│   ├── about/page.tsx    # /about
│   ├── fund/page.tsx     # /fund (permanent redirect to /support)
│   ├── library/page.tsx  # /library
│   ├── n/[slug]/page.tsx # /n/[slug] (Atomic note reader)
│   ├── now/page.tsx      # /now (Living timeline)
│   ├── p/[slug]/page.tsx # /p/[slug] (Long-form essay reader)
│   ├── scribble/page.tsx # /scribble (Aggregated essays, notes, reading)
│   ├── support/page.tsx  # /support (Patronage & contribution ledger)
│   ├── layout.tsx        # Public shell: Header, Nav, Footer, SkipLink
│   └── page.tsx          # Homepage: Hero, latest writing, notes, library
├── admin/                # Private admin interface (isolated, noindex)
│   ├── auth/callback/    # OAuth callback handler
│   ├── compose/          # Full-screen IDE-grade MDX composer
│   ├── login/            # Administrator login page
│   ├── actions.ts        # Server Actions for CRUD operations & cache revalidation
│   ├── layout.tsx        # Admin layout (noindex/nofollow robots)
│   └── page.tsx          # Admin dashboard & overview
├── api/                  # API endpoints
│   ├── contributions/    # POST/GET contribution confirmation
│   ├── login-background/ # Daily wallpaper endpoint for admin login
│   ├── og/               # Dynamic Open Graph image generation endpoint
│   └── webhooks/razorpay # Razorpay webhook signature verification & processing
├── globals.css           # Tailwind CSS v4 entrypoint & typography variables
├── layout.tsx            # Global HTML root layout, font loaders, base JSON-LD
├── error.tsx             # Root error boundary
├── not-found.tsx         # Global 404 handler (with robots: noindex)
├── robots.ts             # Dynamic robots.txt configuration
└── sitemap.ts            # Dynamic sitemap.xml generator
```

- **Belongs here**: Page views, server-side data fetching, metadata generation, route handlers.
- **Does NOT belong here**: Low-level database queries, raw JSX UI components (extract to `components/`), business domain logic (extract to `lib/services/`).

---

### 2. `components/` — UI Presentation Layer
Contains React components split into reusable primitives, public page views, and admin panels.

```
components/
├── admin/                # Admin panels & composition tools
│   ├── compose/          # MDX editor workspace, live preview, diff engine, media drawer
│   ├── admin-dashboard.tsx
│   ├── book-cover-picker.tsx
│   ├── content-manager.tsx
│   ├── featured-manager.tsx
│   └── media-manager.tsx
├── ui/                   # Shared UI primitives
│   ├── actions-menu.tsx  # Context menu popover
│   ├── badge.tsx         # Persona & status badges
│   ├── dialog.tsx        # Accessible modal dialogs
│   ├── essay-cover.tsx   # Typographic cover artwork for essays
│   ├── media-picker-modal.tsx
│   ├── segmented-control.tsx
│   ├── states.tsx        # Standardized empty, loading, error, not-found views
│   └── use-click-outside.ts
├── about-page.tsx
├── blog-post.tsx         # Essay reader view
├── footer.tsx            # Global site footer
├── homepage-hero.tsx
├── homepage-sections.tsx
├── navbar.tsx            # Sticky header with mobile overlay
├── note-page.tsx         # Note reader view
├── now-page.tsx
├── scribble-page.tsx
└── support-page.tsx      # Editorial contribution ledger & payment modal
```

- **Belongs here**: React components, client event handlers, interactive UI state, visual layouts.
- **Does NOT belong here**: Direct database connections, secret keys, server-only modules (`node:crypto`).

---

### 3. `lib/` — Domain, Service, and Data Access Layer
The engine of the application. Contains all business logic, data models, repository adapters, and third-party integrations.

```
lib/
├── config/
│   ├── env.ts            # Environment variable resolvers
│   └── site.ts           # Hardcoded site identity, nav links, hero & footer content
├── repositories/
│   ├── content.repository.ts          # Repository interface contract
│   ├── index.ts                       # Repository export
│   └── supabase-content.repository.ts # Supabase PostgreSQL repository
├── services/
│   └── content.service.ts             # Application service layer
├── supabase/
│   ├── database.types.ts # TypeScript database types
│   └── server.ts         # Supabase client helpers (admin, server, public)
├── constants.ts          # Global site constants, persona labels
├── mdx.ts                # MDX AST parser and serializer
├── razorpay.ts           # HMAC cryptographic verification & webhook parser
├── seo.ts                # Metadata builders, JSON-LD schemas, breadcrumbs
├── types.ts              # Domain type definitions
├── utils.ts              # Utility helpers: slugify, formatDisplayDate, cn
└── validation.ts         # Zod schemas for input validation
```

- **Belongs here**: Pure business logic, data access abstractions, type definitions, helper utilities.
- **Does NOT belong here**: React components, JSX elements, CSS stylesheets.

---

### 4. `tests/` — Automated Test Suite
Contains automated unit and integration tests executed using Node.js's native test runner (`node:test`) via `npx tsx --test`.

```
tests/
├── content-service.test.ts        # Service layer & repository operations
├── contributions-razorpay.test.ts # Payment signatures, webhooks, idempotency
├── dynamic-routes-security.test.ts# Route security & environment safety
├── mdx.test.ts                    # MDX parsing & AST conversion
├── schema.test.ts                 # Database and schema validation
├── seo.test.ts                    # Metadata, JSON-LD, breadcrumbs
├── sitemap-robots.test.ts         # Sitemap & robots.txt rules
├── states.test.ts                 # UI state component behavior
├── utils.test.ts                  # String formatting & slugification
└── validation.test.ts             # Zod input validation schemas
```
