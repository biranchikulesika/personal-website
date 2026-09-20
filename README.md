# Biranchi Kulesika

The source code behind my personal website, [biranchikulesika.com](https://biranchikulesika.com).

This is where I build, experiment, and refine the systems behind my website. The project combines the public-facing site with a custom publishing system, admin interface, content management, authentication, and supporting infrastructure.

The structure and implementation reflect how I currently build web software. Some parts are specific to my website, while others may serve as useful ideas or inspiration for your own projects.

---

## What You'll Find

* Custom editorial interface and design system
* Next.js App Router and React application
* TypeScript and Tailwind CSS v4
* MDX-based publishing system with embedded custom components
* Drizzle ORM and portable PostgreSQL data layer with connection pooling
* Custom admin panel and live split-preview MDX composer
* SEO, JSON-LD structured data, and dynamic Open Graph image generation
* WebAuthn passkey and OAuth authentication isolated behind AuthService
* Razorpay payment integration for patronage
* Automated test suite with an in-memory repository architecture

---

## Tech Stack

| Category | Technologies | Description |
| :--- | :--- | :--- |
| **Framework & Runtime** | Next.js 16 (App Router), React 19, Node.js 24+ | Server Components, Server Actions, and standalone build artifact. |
| **Language & Type Safety** | TypeScript, Zod | Static typing and runtime input schema validation at server boundaries. |
| **Styling & Typography** | Tailwind CSS v4, Newsreader, Space Grotesk | Dark editorial ledger aesthetic, custom theme tokens, zero-layout-shift web fonts. |
| **Database & Persistence** | PostgreSQL, Drizzle ORM, Supabase Storage | Portable relational queries via Drizzle ORM (driver: postgres), 10 schema tables, connection pooling. |
| **Authentication & Access** | Supabase Auth, WebAuthn Passkeys, SimpleWebAuthn | OAuth (Google, GitHub), device biometrics, isolated behind AuthService interface, proxy guard. |
| **Content Engine** | MDX (@mdx-js/mdx, remark-gfm) | Dynamic evaluation with custom blocks (`<Book/>`, `<Post/>`, `<Note/>`, `<Figure/>`, `<YouTube/>`). |
| **Payments & Patronage** | Razorpay Node SDK | Cryptographic HMAC-SHA256 signature verification and webhook processing. |
| **SEO & Social Previews** | @vercel/og, Schema.org JSON-LD | Dynamic edge 1200x630 card generation, sitemap, robots, article and person schemas. |
| **Testing & Tooling** | node:test, node:assert/strict, tsx, ESLint | Native in-memory test runner (221 tests), zero database dependencies, static linting. |

---

## Architecture

The application strictly follows a 4-tier layered architecture with clear boundaries between the user interface, business rules, data abstraction, and database persistence.

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                          1. Presentation Layer                          │
│                                                                         │
│   Public Website: app/(site)/**          Admin Interface: app/admin/**  │
│   - Homepage, /about, /library           - Dashboard & content manager  │
│   - /p/[slug] (Essays)                   - /admin/compose (MDX editor)  │
│   - /n/[slug] (Atomic Notes)             - Passkeys & session manager   │
│   - /now (Timeline), /support            - Subscriber management        │
│                                                                         │
│   UI Components: components/**           API Handlers: app/api/**       │
│   - Primitives: book-cover, states       - /api/og (Dynamic preview)    │
│   - MDX Blocks: <Book/>, <Post/>         - /api/webhooks/razorpay       │
│   - Layouts: navbar, footer, hero        - /api/contributions           │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Calls Server Actions / Services
                                     │ Intercepted by proxy.ts guard
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       2. Application & Service Layer                    │
│                                                                         │
│   ContentService (lib/services/content.service.ts)                      │
│   - Per-request query deduplication using React.cache()                 │
│   - Cross-collection aggregation (getScribbleEntries)                   │
│   - Razorpay HMAC-SHA256 signature verification                         │
│   - On-demand path revalidation coordination                            │
│                                                                         │
│   Infrastructure Abstractions:                                          │
│   - AuthService (lib/auth/auth-service.ts): provider-agnostic auth     │
│   - MediaStorage (lib/storage/media-storage.ts): vendor-neutral storage │
│   - Domain Services: PostService, NowService, MediaService, AdminService│
│   - AiMetadataService (Groq / OpenAI assist), PexelsService             │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Calls interface contracts
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     3. Data Access & Repository Layer                   │
│                                                                         │
│   Domain Repositories (lib/repositories/*.repository.ts)                │
│   - PostRepository, NoteRepository, BookRepository, NowRepository, etc. │
│   - Composed into ContentRepository interface                           │
│                                                                         │
│          ┌─────────────────────────┴─────────────────────────┐          │
│          ▼                                                   ▼          │
│   DrizzleContentRepository                        InMemoryTestContent...│
│   (lib/repositories/drizzle-...)                  (tests/in-memory-...) │
│   - Drizzle ORM query execution                   - Fast in-memory array│
│   - Row mappers (snake_case -> camelCase)           storage for tests   │
│   - Cross-collection slug uniqueness              - Zero database setup │
│   - Portable across any PostgreSQL host           - 221 tests in < 3s   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Queries via PostgreSQL connection
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    4. Database & Persistence Layer                      │
│                                                                         │
│   PostgreSQL (Supabase Postgres, Neon, Local Docker, or VPS)            │
│   - 10 Tables: posts, notes, books, now_entries, media, featured_items, │
│     user_roles, storage_files, subscribers, contributions               │
│   - Drizzle Schema (lib/db/schema/) & Migrations (drizzle/)             │
│   - Connection pooling with hot-reload cache (lib/db/client.ts)         │
│   - Media Storage Bucket: public read, authenticated write              │
└─────────────────────────────────────────────────────────────────────────┘
```

Detailed architectural specifications and data flow guides are in [docs/architecture.md](./docs/architecture.md).

---

## Project Structure

```text
biranchi/
├── app/                  # Next.js App Router
│   ├── (site)/           # Public pages: home, about, library, notes, now, scribble, support
│   ├── admin/            # Private CMS: dashboard, compose, login, auth callback, server actions
│   ├── api/              # Route handlers: contributions, login background, newsletter, og, webhooks
│   ├── globals.css       # Tailwind CSS v4 entrypoint and typography variables
│   ├── layout.tsx        # Root HTML layout, font loaders, and base JSON-LD
│   ├── not-found.tsx     # Global 404 handler with noindex header
│   ├── error.tsx         # Root runtime error boundary
│   ├── robots.ts         # Dynamic robots.txt configuration
│   └── sitemap.ts        # Dynamic sitemap.xml generator
├── components/           # React UI presentation layer
│   ├── admin/            # Admin panels: compose workspace, content manager, media manager, account
│   ├── blocks/           # Custom components embedded in MDX: book-block, post-block, note-block
│   ├── ui/               # Reusable primitives: book-cover, essay-cover, states, toast-view
│   └── *.tsx             # Page views and section layouts: hero, scribble, library, support, navbar
├── docs/                 # Technical documentation
│   ├── architecture.md   # 4-tier model, data flow, and system boundaries
│   ├── database.md       # PostgreSQL schema, tables, triggers, and RLS policies
│   ├── environments.md   # Development, testing, CI, and production environment separation
│   ├── testing.md        # Test suite structure and in-memory testing guide
│   └── *.md              # Dedicated guides for auth, admin, media, SEO, routing, styling, env vars
├── drizzle/              # Drizzle ORM SQL migrations
├── hooks/                # Custom React hooks (use-toast, use-click-outside)
├── lib/                  # Business logic and domain modules
│   ├── auth/             # AuthService interface, SupabaseAuthService, and WebAuthn helpers
│   ├── config/           # Environment variable resolvers and site configuration
│   ├── db/               # Drizzle client, connection pooler, and schema definitions
│   ├── repositories/     # Domain repository interfaces and DrizzleContentRepository
│   ├── services/         # ContentService, domain services, AI metadata, Pexels
│   ├── storage/          # MediaStorage interface and SupabaseMediaStorage implementation
│   ├── supabase/         # Supabase client instances (admin, server, public, database types)
│   ├── constants.ts      # Global site constants and personas
│   ├── mdx.tsx           # MDX compilation engine and custom block registry
│   ├── razorpay.ts       # Razorpay cryptographic verification and webhook parsers
│   ├── seo.ts            # Metadata builders, JSON-LD schemas, and breadcrumbs
│   ├── types.ts          # TypeScript domain models
│   ├── utils.ts          # String helpers, slug derivation, and section parsers
│   └── validation.ts     # Zod runtime schemas for input validation
├── public/               # Static images, avatars, favicons, and web manifest
├── scripts/              # Developer scripts (sync-live-data.sh)
├── supabase/             # Database migrations and Supabase CLI configuration
│   ├── migrations/       # 20260830000000_initial_schema.sql (authoritative reference schema)
│   └── config.toml       # Local Supabase CLI configuration
├── tests/                # Automated test suite (15 test files, 221 tests)
├── docker-compose.yml    # Optional local PostgreSQL container definition
├── drizzle.config.ts     # Drizzle Kit configuration
├── next.config.ts        # Next.js configuration, security headers, standalone output
├── package.json          # Dependencies and scripts
├── proxy.ts              # Route-level authentication guard for admin routes
└── tsconfig.json         # TypeScript compiler configuration
```

---

## Documentation

Full technical guides are available in the [`docs/`](./docs/) directory:

* [**Architecture Overview**](./docs/architecture.md): 4-tier layer model and data flow.
* [**Project Structure**](./docs/project-structure.md): Detailed directory tree and file conventions.
* [**Data Layer**](./docs/data-layer.md): Repository abstraction and per-request caching.
* [**Database Schema**](./docs/database.md): PostgreSQL tables, triggers, and RLS policies.
* [**Authentication**](./docs/authentication.md): Proxy guard, passkeys, and role-based access.
* [**Content System**](./docs/content-system.md): Content types, personas, and MDX compilation.
* [**Admin Panel**](./docs/admin.md): Composer workspace, dashboard tabs, and server actions.
* [**Media & Storage**](./docs/media.md): Supabase Storage bucket, tags, and dynamic OG engine.
* [**SEO & Metadata**](./docs/seo.md): JSON-LD schemas, sitemaps, and search optimization.
* [**Routing**](./docs/routing.md): App Router groups, static generation, and boundaries.
* [**Components & Design**](./docs/components.md): UI primitives and horizontal ledger styling.
* [**Styling & Theming**](./docs/styling.md): Tailwind CSS v4, theme tokens, and typography.
* [**Environment Variables**](./docs/environment.md): Master environment variable reference.
* [**Environment Separation**](./docs/environments.md): Development, CI, and production runtime isolation.
* [**Testing Guidelines**](./docs/testing.md): Native test runner and test suite map.
* [**Deployment Guidelines**](./docs/deployment.md): Standalone builds, Vercel setup, and security headers.

---

## Getting Started

### Prerequisites

* **Node.js**: `>= 24.16.0` (Recommended: `24.18.0`)
* **Package Manager**: `npm`

### Installation

```bash
git clone https://github.com/biranchikulesika/biranchi.git
cd biranchi
npm install
```

### Running Locally

```bash
# Start local development server
npm run dev

# Run automated tests (221 tests)
npm test

# Run code linter
npm run lint

# Run TypeScript typechecks
npm run typecheck

# Build production artifact
npm run build
```

---

## Security

If you discover a security vulnerability, please review [SECURITY.md](./SECURITY.md) and report it privately to [security@kulesika.in](mailto:security@kulesika.in). Please do not open public issues or pull requests for security vulnerabilities.

---

## License

Copyright (c) 2026 Biranchi Kulesika. All Rights Reserved.

This repository is made publicly accessible for transparency and educational reference only. It is **not** open source software. You may not copy, reproduce, modify, redistribute, or use the code, layout, design, editorial aesthetic, typography, photography, or written content for public or commercial purposes.

See the full terms in [LICENSE](./LICENSE).

---

[Visit the website →](https://biranchikulesika.com)