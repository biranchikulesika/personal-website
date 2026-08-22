# Biranchi Kulesika — Personal Website & Publishing Engine

A modern, high-performance personal website and publishing engine for **Biranchi Kulesika** ([biranchikulesika.com](https://biranchikulesika.com)).

Built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS v4**, and **PostgreSQL / Supabase**, featuring an editorial design system, an IDE-grade MDX composer, structured data for search engine & AI crawlability, and payment processing.

---

## Key Highlights

- **Editorial Design System**: Typography-first layout combining Space Grotesk and Newsreader serif fonts on a dark canvas (`#141413`). Clean horizontal-ruled ledgers replace card containers.
- **Decoupled Service Architecture**: Strict separation of concerns (`UI → Service → Repository → Database`), querying production Supabase PostgreSQL with typed schemas.
- **IDE-Grade MDX Composer (`/admin/compose`)**: Full-screen workspace with bi-directional AST Markdown parsing, split live preview, visual character diff viewer, metadata management, and media drawer.
- **SEO & AI Discoverability**: Automated canonical URLs, Open Graph dynamic banner generation (`/api/og`), BreadcrumbList schemas, Article/Note JSON-LD, dynamic `sitemap.xml`, and crawler isolation.
- **Patronage & Payments**: Razorpay checkout integration and webhook receiver with constant-time HMAC-SHA256 signature verification and idempotent database persistence.
- **Production-Hardened**: Node.js native test runner (140+ tests), standalone Docker-ready build output (`output: 'standalone'`), HTTP security headers (HSTS, CSP, X-Frame-Options), and strict Row-Level Security (RLS).

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    1. Presentation / UI                     │
│  (Next.js App Router: app/(site), app/admin, components/)   │
└──────────────────────────────┬──────────────────────────────┘
                               │ Calls
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               2. Application / Service Layer                │
│                 (lib/services/content.service.ts)           │
│    - Business operations, validations, aggregation, auth    │
└──────────────────────────────┬──────────────────────────────┘
                               │ Calls interface
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             3. Data Access / Repository Layer               │
│               (lib/repositories/supabase-content.repository.ts)
│    - Typed database queries, row mappers, storage           │
└──────────────────────────────┬──────────────────────────────┘
                               │ Interacts with
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               4. Database / Persistence Layer               │
│                    (Supabase PostgreSQL)                    │
└─────────────────────────────────────────────────────────────┘
```

For in-depth architectural breakdowns, see [`docs/architecture.md`](./docs/architecture.md).

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 16 (App Router, Server Actions, Server Components) |
| **UI Library** | React 19, Tailwind CSS v4, `@tailwindcss/typography` |
| **Language** | TypeScript (Strict mode) |
| **Database** | PostgreSQL 16 via Supabase (`schema.sql`) |
| **Storage** | Supabase Storage (`media` bucket) |
| **Validation** | Zod v4 |
| **Payments** | Razorpay (Checkout + Webhooks) |
| **Testing** | Node.js Native Test Runner (`node:test`, `node:assert/strict` via `tsx`) |

---

## Project Structure

```
biranchi/
├── app/                  # Next.js App Router (pages, layouts, API routes)
│   ├── (site)/           # Public routes: /, /about, /library, /p/:slug, /n/:slug, /scribble, /support
│   ├── admin/            # Admin dashboard and MDX composer
│   └── api/              # API endpoints: contributions, webhooks, OG generator
├── components/           # React presentation components & shared UI primitives
├── docs/                 # Comprehensive technical documentation suite
├── lib/                  # Services, repositories, Supabase client, validations, types, SEO
├── public/               # Static assets & public media
├── tests/                # Automated unit and integration test suite
├── schema.sql            # Idempotent PostgreSQL/Supabase database schema
└── next.config.ts        # Next.js production configuration & security headers
```

See [`docs/project-structure.md`](./docs/project-structure.md) for full directory documentation.

---

## Getting Started

### 1. Prerequisites
- **Node.js**: `>= 24.16.0` (Recommended: `nvm use 24.18.0`)
- **Package Manager**: `npm`

### 2. Installation
```bash
git clone https://github.com/biranchikulesika/biranchi.git
cd biranchi
npm install
```

### 3. Environment Configuration
Create a local `.env.local` file from `.env.example` and fill in your Supabase credentials:
```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

For production environment variables (Supabase, Razorpay, etc.), refer to [`docs/environment.md`](./docs/environment.md) and `.env.production.example`.

### 4. Available Commands

| Command | Action |
| :--- | :--- |
| `npm run dev` | Start the local Next.js development server with hot reloading. |
| `npm test` | Run the complete automated test suite via Node.js native test runner. |
| `npm run lint` | Run ESLint across all TypeScript and React files. |
| `npm run build` | Compile the optimized production build (`output: 'standalone'`). |
| `npm start` | Start the production server. |

---

## Database Setup

The database schema is defined declaratively and idempotently in [`schema.sql`](./schema.sql).

To initialize or migrate a Supabase database:
1. Open the SQL Editor in your Supabase dashboard.
2. Paste and run [`schema.sql`](./schema.sql).
3. The script will automatically create all tables (`posts`, `notes`, `books`, `now_entries`, `media`, `featured_items`, `user_roles`, `contributions`, `storage_files`), cross-collection triggers, RLS policies, and the `media` storage bucket.

For full database documentation, see [`docs/database.md`](./docs/database.md).

---

## Documentation Suite

Detailed maintainer guides are available in the [`docs/`](./docs/) directory:

- [**System Architecture**](./docs/architecture.md)
- [**Project Structure**](./docs/project-structure.md)
- [**Data Layer & Repositories**](./docs/data-layer.md)
- [**Database Schema & RLS**](./docs/database.md)
- [**Authentication & RBAC**](./docs/authentication.md)
- [**Content System & MDX Engine**](./docs/content-system.md)
- [**Admin Panel & Composer**](./docs/admin.md)
- [**Media & Storage**](./docs/media.md)
- [**SEO & AI Discoverability**](./docs/seo.md)
- [**Routing & Server Boundaries**](./docs/routing.md)
- [**Components & UI Primitives**](./docs/components.md)
- [**Styling & Design System**](./docs/styling.md)
- [**Environment Variables**](./docs/environment.md)
- [**Testing Guidelines**](./docs/testing.md)
- [**Production Deployment**](./docs/deployment.md)
- [**Developer Contributing & How-To Guides**](./docs/contributing.md)

---

## License

Private / All rights reserved © 2026 Biranchi Kulesika.