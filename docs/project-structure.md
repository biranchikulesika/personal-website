# Project Structure

This document outlines the directory structure of the repository, explaining the purpose of each folder and where code belongs.

```text
personal-website/
├── app/                  # Next.js App Router (pages, layouts, route handlers, server actions)
├── components/           # React presentation components and UI primitives
├── docs/                 # Technical documentation
├── hooks/                # Custom React hooks
├── lib/                  # Services, repositories, configurations, types, utilities
├── public/               # Static images, icons, and web manifest
├── scripts/              # Maintenance scripts
├── supabase/             # Supabase schema migrations and configuration
├── tests/                # Automated test suite
├── next.config.ts        # Next.js configuration, security headers, image domains
├── package.json          # Dependencies and scripts
├── proxy.ts              # Route-level authentication guard for admin routes
└── tsconfig.json         # TypeScript compiler configuration
```

---

## Detailed Directory Breakdown

### 1. `app/`: Routing and Server Boundaries
Houses Next.js App Router pages, layouts, metadata generators, route handlers, and server actions.

```text
app/
├── (site)/               # Public website route group
│   ├── about/            # /about
│   ├── library/          # /library (Curated reading catalog)
│   ├── n/[slug]/         # /n/:slug (Atomic notes)
│   ├── now/              # /now (Living focus timeline)
│   ├── p/[slug]/         # /p/:slug (Long-form essays)
│   ├── scribble/         # /scribble (Aggregated essays and notes feed)
│   ├── support/          # /support (Patronage and contribution ledger)
│   ├── layout.tsx        # Public shell: Header, Navigation, Footer, SkipLink
│   └── page.tsx          # Homepage: Hero, latest writing, notes, library highlights
├── admin/                # Private admin interface (isolated, noindex)
│   ├── auth/callback/    # OAuth code exchange route handler
│   ├── compose/          # MDX composer workspace
│   ├── login/            # Admin login page and auth actions
│   ├── actions.ts        # Server Actions for CRUD operations and cache revalidation
│   ├── layout.tsx        # Admin layout with noindex and nofollow robots header
│   └── page.tsx          # Admin dashboard
├── api/                  # API endpoints
│   ├── contributions/    # POST/GET payment confirmation and history
│   ├── login-background/ # Daily background wallpaper for admin login
│   ├── newsletter/       # POST newsletter subscription
│   ├── og/               # Dynamic Open Graph image generator
│   └── webhooks/razorpay # Razorpay webhook signature verification and processing
├── globals.css           # Tailwind CSS theme tokens and typography variables
├── layout.tsx            # Global HTML root layout, fonts, and base JSON-LD
├── error.tsx             # Root error boundary
├── not-found.tsx         # Global 404 handler with noindex header
├── robots.ts             # Dynamic robots.txt configuration
└── sitemap.ts            # Dynamic sitemap.xml generator
```

- **Belongs here**: Route entry points, page data loading, metadata declarations, route handlers.
- **Does not belong here**: Direct database queries, business domain logic, reusable UI components.

---

### 2. `components/`: UI Presentation Layer
Contains React components split into reusable primitives, public views, and admin panels.

```text
components/
├── admin/                # Admin panels and composer tools
│   ├── compose/          # MDX editor workspace, live preview, diff viewer, media drawer
│   ├── account-manager.tsx   # Passkeys, active sessions, OAuth providers
│   ├── admin-dashboard.tsx   # Dashboard navigation and tab router
│   ├── book-cover-picker.tsx # Cover search and selection via Pexels API
│   ├── content-manager.tsx   # Searchable tables for posts, notes, books, now entries
│   ├── home-overview.tsx     # Overview metrics and recent activity
│   ├── media-manager.tsx     # Image upload, tag manager, orphan asset cleanup
│   └── subscriber-manager.tsx# Newsletter subscriber list and management
├── blocks/               # Embedded MDX custom components
│   ├── book-block.tsx    # Embedded book card (<Book slug="..." />)
│   ├── library.tsx       # Embedded library section
│   ├── note-block.tsx    # Embedded note card (<Note slug="..." />)
│   └── post-block.tsx    # Embedded post card (<Post slug="..." />)
├── ui/                   # Reusable UI primitives
│   ├── book-cover.tsx    # Responsive book artwork display
│   ├── essay-cover.tsx   # Typographic cover artwork for essays
│   ├── states.tsx        # Standardized empty, loading, error, and 404 state views
│   ├── toast-view.tsx    # Accessible toast notifications
│   ├── use-click-outside.ts # Click outside hook for dropdowns and popovers
│   └── user-avatar.tsx   # User profile image with fallback
├── about-page.tsx        # About page view
├── blog-post.tsx         # Essay reader view
├── footer.tsx            # Global site footer
├── hero.tsx              # Homepage hero intro
├── home-content.tsx      # Homepage content wrapper
├── icons.tsx             # Inline SVG icons
├── library-page.tsx      # Library page view
├── library-section.tsx   # Homepage library section
├── mdx-view.tsx          # MDX content renderer
├── navbar.tsx            # Navigation header with mobile drawer
├── newsletter-form.tsx   # Newsletter signup form
├── note-page.tsx         # Note reader view
├── notes-section.tsx     # Homepage notes section
├── now-page.tsx          # Now timeline view
├── persona-badge.tsx     # Persona badge pill component
├── scribble-page.tsx     # Searchable scribble feed
├── section-heading.tsx   # Standard section heading component
├── share-menu.tsx        # Social share popover
├── support-page.tsx      # Support page with Razorpay payment modal
└── writing-section.tsx   # Homepage writing section
```

- **Belongs here**: Visual elements, interactive client state, presentation logic.
- **Does not belong here**: Secret keys, database client instances, direct SQL or Supabase calls.

---

### 3. `lib/`: Domain, Service, and Data Access Layer
Contains application business logic, data models, repository adapters, and third-party integrations.

```text
lib/
├── auth/
│   ├── admin.ts                   # Admin role checks (isAdminRole)
│   ├── auth-service.ts            # Vendor-neutral AuthService interface
│   ├── index.ts                   # Auth service factory
│   ├── supabase-auth-service.ts   # Supabase Auth provider implementation
│   └── webauthn.ts                # Passkey challenge generation, signing, and verification
├── config/
│   ├── env.ts                     # Environment variable resolution helpers
│   └── site.ts                    # Hardcoded site navigation, identity, and footer links
├── db/
│   ├── client.ts                  # Drizzle ORM client with connection pooling
│   ├── index.ts                   # DB client and schema exports
│   └── schema/                    # Typed Drizzle PostgreSQL table schemas
│       ├── books.ts, contributions.ts, featured.ts, media.ts
│       ├── notes.ts, now-entries.ts, posts.ts, storage-files.ts
│       └── subscribers.ts, user-roles.ts, index.ts
├── repositories/
│   ├── post.repository.ts         # Domain repository interfaces
│   ├── note.repository.ts, book.repository.ts, now.repository.ts
│   ├── media.repository.ts, subscriber.repository.ts, etc.
│   ├── content.repository.ts      # Composed ContentRepository interface contract
│   ├── drizzle-content.repository.ts # Drizzle ORM PostgreSQL implementation
│   ├── supabase-content.repository.ts# Supabase client repository implementation
│   └── index.ts                   # Provider-independent repository factory
├── services/
│   ├── admin.service.ts           # Admin domain operations
│   ├── ai-metadata.service.ts     # LLM metadata generator (Groq / OpenAI)
│   ├── content.service.ts         # Domain service with React.cache deduplication
│   ├── media.service.ts           # Media asset domain service
│   ├── now.service.ts             # Now timeline domain service
│   ├── pexels.service.ts          # Pexels API client for book covers and wallpapers
│   ├── post.service.ts            # Post domain operations
│   └── index.ts                   # Unified service exports
├── storage/
│   ├── media-storage.ts           # Vendor-neutral MediaStorage interface
│   ├── supabase-media-storage.ts  # Supabase Storage implementation
│   └── index.ts                   # Storage factory
├── supabase/
│   ├── client.ts                  # Browser Supabase client
│   ├── database.types.ts          # TypeScript database definitions
│   └── server.ts                  # Server-side Supabase clients (admin, server, public)
├── constants.ts                   # Global site constants and persona definitions
├── mdx.tsx                        # MDX compiler using @mdx-js/mdx, remark-gfm, and custom blocks
├── razorpay.ts                    # HMAC verification and webhook parser
├── seo.ts                         # Metadata builders, JSON-LD schemas, breadcrumbs
├── types.ts                       # TypeScript domain types
├── utils.ts                       # String helpers, slugification, markdownToPostSections
└── validation.ts                  # Zod schemas for input validation
```

- **Belongs here**: Business logic, data models, repository implementations, helper functions.
- **Does not belong here**: React components, JSX markup, CSS stylesheets.

---

### 4. `tests/`: Automated Test Suite
Automated unit and integration tests executed using Node.js's native test runner (`node:test`) via `tsx`.

```text
tests/
├── account-auth-security.test.ts  # Session management, provider link and unlink rules
├── content-lifecycle.test.ts      # Post creation, editing, slug checks, status toggles
├── contributions-razorpay.test.ts # Payment HMAC verification, webhooks, idempotency
├── dynamic-routes-security.test.ts# Route security and 404 handling
├── fixtures.ts                    # Test seed fixtures for posts, notes, books
├── in-memory-test-content-repository.ts # Fast in-memory repository for tests
├── mdx.test.ts                    # MDX parsing, section parsing, and serializing
├── newsletter.test.ts             # Newsletter subscription and deletion logic
├── seo.test.ts                    # Metadata, JSON-LD, breadcrumbs
├── server-actions-security.test.ts# Authorization checks on server actions
├── service-layer-extra.test.ts    # Env resolution and featured items handling
├── service-layer.test.ts          # Core service layer operations
├── sitemap-robots.test.ts         # Dynamic sitemap and robots.txt inclusion rules
├── states.test.ts                 # State view components and accessibility
├── utils.test.ts                  # String helpers, dates, slug generation
├── validation.test.ts             # Zod input validation schemas
└── webauthn-security.test.ts      # Passkey challenge signing and verification
```
