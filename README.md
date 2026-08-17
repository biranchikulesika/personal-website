# Multi-Persona Digital Garden & CMS

A high-performance, aesthetically refined digital space to capture, organize, and publish thoughts across multiple dimensions of life (personas). Built with modern web technologies, this platform serves as both a public-facing digital garden and a private, block-based content management system.

## 🌟 Key Features

*   **Multi-Persona Architecture:**
    *   **Thinker:** A space for deep questions, isolated thought fragments, and book reviews.
    *   **Wanderer:** An interactive, cyclical canvas for poetry, journal moments, and fleeting fragments.
    *   **Builder:** A home for build logs, system architecture docs, and project statuses.
    *   **Operator:** Dedicated specifically to current operational focuses and actionable goals.
*   **TipTap-Powered WYSIWYG Editor:** A highly advanced, custom-built rich text editor inspired by Notion.
    *   **Slash Commands (`/`)**: Instantly summon headings, code blocks, tables, toggle lists (`<details>`), and terminal blocks.
    *   **Dynamic Typography**: The editor's font and layout adapt in real-time to match the selected persona (e.g., monospace for Operator, elegant serifs for Thinker).
    *   **Custom Blocks**: Supports bespoke blocks like a MacOS-style Terminal with syntax highlighting and one-click copy.
*   **Payments Integration:** Fully integrated Razorpay support for seamless transactions and webhook handling.
*   **Next.js App Router:** Optimized for server components, automatic caching, and minimal client-side JavaScript.
*   **Supabase Backend:** Utilizes Supabase for PostgreSQL database, secure user authentication, and robust image/bucket storage.
*   **Elegant & Responsive UI:** Powered by Tailwind CSS v4 with bespoke animations utilizing `motion/react`. Uses precise typography pairings (Inter, JetBrains Mono, Space Grotesk).
*   **Markdown Rendering:** Safely renders markdown components with `react-markdown`, `remark-gfm`, and `rehype-sanitize`.
*   **Secure Actions:** End-to-end type-safe API operations guarded by `ensureAdmin()` checks and robust `Zod` validation schemas.

## 🛠 Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/) (App Router, Server Actions)
*   **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
*   **Backend & DB:** [Supabase](https://supabase.com/) (PostgreSQL, Storage, Auth)
*   **Payments:** [Razorpay](https://razorpay.com/)
*   **Editor:** [TipTap](https://tiptap.dev/) (ProseMirror-based with `lowlight` syntax highlighting)
*   **Validation:** [Zod](https://zod.dev/)
*   **Animation:** [Motion (Framer Motion)](https://motion.dev/)
*   **Typography:** Google Fonts (`next/font/google`), Tailwind Typography plugin
*   **Icons:** [Lucide React](https://lucide.dev/)

## 🚀 Getting Started

### Prerequisites

Ensure you have Node.js (version 24.16.0 or higher) installed on your machine.

### 1. Clone & Install

```bash
# Install dependencies
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file at the root of the project by copying the example format. You will need your Supabase credentials to run this app locally:

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
# Required for server-side elevated privilege (keep secret!)
SUPABASE_SECRET_KEY=your_supabase_secret_key
```

### 3. Run the Development Server

Start the local Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the outcome.

## 🏗 Directory Structure

*   **/app:** Next.js App Router routes (files here become URLs).
    *   **/admin:** Protected dashboard — `actions/` holds the secure Server Actions (DB + auth), `login/` the auth flow, and `(dashboard)/` the content management pages (compose, posts, library, media, newsletter, settings, …).
    *   **/actions:** Public-facing Server Actions (search, newsletter subscription, donations).
    *   **/[builder|operator|thinker|wanderer]:** Persona route groups (home, about, blogs, newsletter). Each page is a thin wrapper around shared components in `components/<area>/shared/`.
    *   **/api:** Route handlers — cron jobs, Razorpay webhooks, passkey registration, OG images, revalidation.
    *   **/p/[slug]:** Public post pages. Sitemap/feed/robots routes live alongside.
*   **/components:** Reusable React components, grouped by area.
    *   **/ui:** Base-level UI elements (logo, skeletons, canvas).
    *   **/admin:** Admin-only form validation and editor components.
    *   **/blog, /newsletter, /builder, /thinker, /wanderer, /reading:** Persona/area-specific components; shared code in `<area>/shared/`.
    *   **/mdx:** Markdown/MDX view components (content blocks + core element overrides).
    *   **/post-renderer:** Client renderer for public post pages.
    *   **/seo:** `JsonLd` structured data.
*   **/hooks:** Shared React hooks (kebab-case filenames).
*   **/lib:** Non-UI application code.
    *   **/repositories:** Data-access layer — one `*.repository.supabase.ts` per table, plus a `registry.ts` factory.
    *   **/services:** Business logic orchestrating repositories.
    *   **/supabase:** Supabase clients (browser, server, admin, middleware) and storage/upload helpers.
    *   **/auth:** Passkey/WebAuthn verification and server auth checks.
    *   **/ai:** AI post-metadata generation (excerpts, tags, SEO).
    *   **/mdx:** MDX compilation and rendering.
    *   **/config:** Site/SEO configuration.
    *   **/data:** Static content data (quotes, phrases).
    *   `types.ts`: Domain TypeScript types. `schemas.ts`: Zod validation schemas.
    *   `queries.ts`: Cached server-side query functions. `block-serializer.ts`: compose-editor block serialization.
    *   `database.types.ts`: Generated Supabase types.
*   **/scripts:** Standalone Node scripts (build-log generation, donation cleanup, passkey tests).
*   **/supabase:** SQL schema (`schema.sql`), reset (`reset.sql`), storage setup (`storage.sql`), and local dev config (`config.toml`).
*   **/tests:** Unit/integration tests (`npm test`).
*   **/public:** Static assets (icons, images, manifest).

## 🔐 Security Notes

This application strictly enforces security through several layers:
1.  **Row Level Security (RLS)** is applied to the Supabase database.
2.  Protected Server Actions validate user sessions explicitly (`verifyAuth`).
3.  Zod strictly strips out unauthorized objects/properties during API calls.
4.  User-generated Markdown is sanitized via `rehype-sanitize` to prevent XSS.
5.  Storage endpoints enforce server-side validation of MIME types and size limits.

## 📄 License
This project is open-source. Feel free to fork and customize your own digital garden.
