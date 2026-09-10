# Biranchi Kulesika — Technical Documentation

Welcome to the engineering documentation for the Biranchi Kulesika website and content publishing system.

This codebase is a modern, high-performance web platform built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, and **Tailwind CSS v4**. It features an editorial design system, an IDE-grade admin content composer, a decoupled 4-tier data architecture, dynamic structured data for search engine and AI crawlability, and payment/patronage processing.

---

## Quick Navigation

| Document | Description |
| :--- | :--- |
| [**Architecture**](./architecture.md) | The 4-tier layer model (`UI → Service → Repository → Database`), data flow, and design boundaries. |
| [**Project Structure**](./project-structure.md) | Walkthrough of the directory tree, naming conventions, and file placement rules. |
| [**Data Layer**](./data-layer.md) | Repository pattern, Supabase PostgreSQL data access, and `ContentService`. |
| [**Database & Schema**](./database.md) | PostgreSQL / Supabase schema, `supabase/migrations/20260830000000_initial_schema.sql`, tables, indexes, triggers, and RLS policies. |
| [**Authentication & Security**](./authentication.md) | Role-based authorization (`user_roles`), proxy guards, and environment safety locks. |
| [**Content System**](./content-system.md) | Essays (posts), atomic notes, library books, now timeline, and scribble feed. |
| [**Admin & Composer**](./admin.md) | Admin dashboard, IDE-grade MDX composer workspace, split live preview, and diff viewer. |
| [**Media & Storage**](./media.md) | Asset catalog, Supabase Storage bucket `media`, orphan detection, and dynamic OG engine. |
| [**SEO & AI Crawlability**](./seo.md) | Metadata builders, JSON-LD structured schemas, dynamic sitemap, robots.txt, and canonicals. |
| [**Routing**](./routing.md) | Next.js App router groups, dynamic slug routes, API handlers, and route redirects. |
| [**Components & Design System**](./components.md) | UI primitives, shared state views, typographic ledgers, modal dialogs, and styling rules. |
| [**Styling & Theming**](./styling.md) | Tailwind CSS v4 setup, night/paper dark palette, Newsreader serif and Space Grotesk typography. |
| [**Environment Configuration**](./environment.md) | Environment variables reference, safety guards, and runtime configuration. |
| [**Testing**](./testing.md) | Node.js native test runner via `tsx`, suite structure, and writing automated tests. |
| [**Deployment**](./deployment.md) | Production builds (`output: 'standalone'`), Supabase deployment, and security hardening. |
| [**Contributing & How-To Guides**](./contributing.md) | Step-by-step developer guides: adding content types, pages, tables, components, and APIs. |

---

## Core Architectural Principles

1. **Strict Service & Repository Separation**
   - UI components (`components/`, `app/`) never query databases or Supabase clients directly.
   - All operations flow: `UI Component → Server Action / Service → Repository → Supabase`.
2. **Authoritative PostgreSQL Database**
   - The application connects to Supabase PostgreSQL (`lib/repositories/supabase-content.repository.ts`) via the unified `ContentRepository` contract.
3. **No Buzzwords & Editorial Typography**
   - UI avoids heavy card borders and generic marketing components in favor of open, typographic horizontal ledgers and high-contrast dark tones.
4. **Absolute Admin Isolation**
   - The `/admin` surface is never referenced in public sitemaps, robots.txt, navigation menus, or search metadata.
5. **Idempotency Everywhere**
   - Database schemas (`supabase/migrations/20260830000000_initial_schema.sql` — the single source of truth), payment processing (Razorpay webhooks & client confirmations), and content mutations are fully idempotent.

---

## Getting Started

### 1. Prerequisites
- **Node.js**: `>= 24.16.0` (Recommended: `nvm use 24.18.0`)
- **Package Manager**: `npm`

### 2. Installation
```bash
git clone <repository-url>
cd biranchi
npm install
```

### 3. Environment Setup
Create a local `.env.local` file from `.env.example`:
```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

### 4. Running the Project
```bash
# Start the development server
npm run dev

# Run the test suite (120+ tests)
npm test

# Run ESLint validation
npm run lint

# Compile production build
npm run build
```
