# Technical Documentation

This directory contains technical documentation for the Biranchi Kulesika website and publishing system.

The application is built with Next.js (App Router), React, TypeScript, Tailwind CSS, and Supabase PostgreSQL. It includes a public editorial website, an administrative content composer, role-based authentication, structured metadata for search engines, and payment support via Razorpay.

---

## Documentation Index

| Document | Purpose |
| :--- | :--- |
| [**Architecture**](./architecture.md) | The 4-tier layer model (UI, Service, Repository, Database), data flow, and system boundaries. |
| [**Project Structure**](./project-structure.md) | Directory organisation, naming conventions, and file placement rules. |
| [**Data Layer**](./data-layer.md) | Repository pattern, Supabase repository implementation, row mappers, and per-request caching. |
| [**Database**](./database.md) | PostgreSQL schema, tables, indexes, triggers, and Row Level Security policies. |
| [**Authentication**](./authentication.md) | Admin route guards, proxy middleware, role-based access control, and passkey authentication. |
| [**Content System**](./content-system.md) | Content models (posts, notes, books, now entries, scribble entries), personas, and MDX compilation. |
| [**Admin**](./admin.md) | Dashboard, MDX composer, server actions, and management tools. |
| [**Media**](./media.md) | Storage bucket, media tagging, orphan asset cleanup, and dynamic social preview images. |
| [**SEO and Metadata**](./seo.md) | Metadata builders, JSON-LD structured data, dynamic sitemap, and robots configuration. |
| [**Routing**](./routing.md) | App Router groups, dynamic slug routes, server action boundaries, and error handlers. |
| [**Components**](./components.md) | UI component organisation, standardized state views, and editorial styling conventions. |
| [**Styling**](./styling.md) | Tailwind CSS setup, theme tokens, color palette, and typography stacks. |
| [**Environment Variables**](./environment.md) | Complete environment variable reference, client versus server isolation, and credential rotation. |
| [**Environment Separation**](./environments.md) | Development, CI validation, and production runtime isolation using standalone output. |
| [**Testing**](./testing.md) | Native Node.js test runner using tsx, test suite layout, and in-memory repository testing. |
| [**Deployment**](./deployment.md) | Production builds, standalone artifacts, database deployment, and security headers. |

---

## Core Principles

1. **Strict Layer Separation**
   UI components in `components/` and `app/` never query the database directly. All operations flow through the Service Layer and Repository Layer.

2. **Authoritative Database**
   Supabase PostgreSQL is the single source of truth for all dynamic content and user roles.

3. **Admin Isolation**
   Admin routes (`/admin`) are protected by proxy middleware and server checks. They are never exposed in public navigation, sitemaps, or robots.txt.

4. **Idempotent Operations**
   Database schemas, payment confirmations, and content saves are designed to be safe when repeated.

5. **Self-Contained Testing**
   Automated tests run against an in-memory repository mock. Running tests does not require an active database connection and cannot affect live data.

---

## Key Commands

```bash
# Start the local development server
npm run dev

# Run the automated test suite (221 tests)
npm test

# Run code quality linting
npm run lint

# Run compile-time TypeScript checks
npm run typecheck

# Build the production artifact
npm run build
```
