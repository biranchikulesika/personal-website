# AGENTS.md — Agent & Developer Operating Manual

This file is the single source of truth for AI agents and developers working on this repository. Every rule outlined below must be strictly adhered to without exception.

---

## 1. Branch Management & Git Workflow

### Production Branch & Release Policy
* **`production` is the deployment branch.**
* AI agents must never check out, commit to, rebase onto, merge into, or push directly to `production` during daily feature development.
* **Production Releases via PR**: Only when the repository owner gives **explicit instruction** to release to production, the agent will open a PR from `develop` targeting `production` and execute the squash merge (e.g., using `gh pr create` and `gh pr merge --squash`).

### Post-Production Merge & Develop Recreation Workflow
* After a successful PR and squash merge into `production`, GitHub PR pruning deletes the remote `develop` head.
* The agent must immediately perform the following sequence:
  1. Switch to `production`:
     ```bash
     git checkout production
     ```
  2. Pull to update the local `production` branch:
     ```bash
     git pull origin production
     ```
  3. Delete the old local `develop` branch:
     ```bash
     git branch -D develop
     ```
  4. Create and checkout a fresh `develop` branch from the updated `production`:
     ```bash
     git checkout -b develop
     ```
  5. Push the new `develop` branch to origin:
     ```bash
     git push -u origin develop
     ```
  * This guarantees that after every production release, `develop` is re-created cleanly, starting 1:1 in sync with `production`.

### Develop Branch Policy
* **`develop` is the base development branch.**
* **Never make direct commits or edits on `develop`.**
* All development, refactoring, bugfixes, and documentation updates must happen on an isolated feature branch off `develop`.

### Single Active Branch Rule
* **Rule of One:** At any point in time, there must **never be more than 1 active branch off `develop`**.
* Before beginning any task:
  1. Check the existing branch list (`git branch`).
  2. If an active feature/working branch already exists (other than `develop` and `production`), **switch to and continue working on that branch**.
  3. If no working branch exists (only `develop` and `production` exist), create a new branch from `develop`:
     ```bash
     git checkout develop
     git checkout -b <type>/<short-description>
     ```
     *(e.g., `feat/patron-tier-management`, `fix/slug-collision-handler`, `docs/update-agents-md`)*

### Merge & Pruning Workflow (Feature → Develop)
* Keep working and committing on the active feature branch.
* **Do NOT merge into `develop` until explicitly instructed by the repository owner.**
* When and only when the repository owner gives explicit instruction to merge (e.g., via PR or squash merge):
  1. Squash merge the active branch into `develop`.
  2. Immediately prune (delete) the feature branch locally (and remotely if tracking) so that only `develop` (with new changes) and `production` (untouched) remain.
  3. Verify that the repository is clean and ready for the next task.

---

## 2. System Architecture & Layer Boundaries

The platform strictly follows a **4-tier layered architecture**. Maintain clean, unambiguous separation between UI, business logic, data abstraction, and database persistence.

```text
┌─────────────────────────────────────────────────────────────┐
│                    1. Presentation / UI                     │
│  (Next.js App Router: app/(site), app/admin, components/)   │
└──────────────────────────────┬──────────────────────────────┘
                               │ Calls (Server Actions / async components)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               2. Application / Service Layer                │
│             (lib/services/content.service.ts)               │
│    - Business operations, validations, aggregation, auth    │
└──────────────────────────────┬──────────────────────────────┘
                               │ Calls interface contract
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             3. Data Access / Repository Layer               │
│      (lib/repositories/supabase-content.repository.ts)      │
│    - Typed database queries, row mappers, Supabase access   │
└──────────────────────────────┬──────────────────────────────┘
                               │ Interacts with
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               4. Database / Persistence Layer               │
│                    (Supabase PostgreSQL)                    │
└─────────────────────────────────────────────────────────────┘
```

### Architectural Guardrails
* **UI Components (`components/**`, `app/**`)**:
  * Must **NEVER** import database clients, execute SQL queries, or access `@supabase/supabase-js` directly.
  * Must always call the Service Layer (`lib/services/`) or Server Actions (`app/admin/actions.ts`).
* **Service Layer (`lib/services/`)**:
  * Encapsulates domain logic, validation coordination, cross-collection aggregation (e.g. scribble feed), cryptographic operations (Razorpay HMAC-SHA256 signature verification), and cache revalidation (`revalidatePath`).
  * Never contains JSX markup or direct database drivers; operates exclusively on domain models (`lib/types.ts`).
* **Repository Layer (`lib/repositories/`)**:
  * Declared in `content.repository.ts` interface and implemented in `supabase-content.repository.ts`.
  * Handles database queries, row mapping to domain types, slug uniqueness, and CRUD operations.
  * Does not contain business rules (e.g., does not calculate taxes or verify payment signatures).
* **Domain Types & Validations**:
  * Domain models live in `lib/types.ts`.
  * Zod schemas for runtime input validation live in `lib/validation.ts`.
  * Environment variables and credentials are resolved via `lib/config/env.ts`.

---

## 3. Database Rules (Supabase PostgreSQL)

* **Supabase PostgreSQL** is the single, authoritative database for all dynamic data.
* All dynamic entities live in Supabase:
  * **Posts / Essays** (`public.posts`)
  * **Notes** (`public.notes`)
  * **Books / Reading Catalog** (`public.books`)
  * **Now Timeline** (`public.now_entries`)
  * **Media & Asset Tracking** (`public.media`)
  * **User Roles & Access** (`public.user_roles`)
  * **Contributions / Patronage** (`public.contributions`)
  * **Newsletter Subscribers** (`public.newsletter_subscribers`)
* **Schema Integrity & Migrations**:
  * Master schema lives in `schema.sql`.
  * Migration files live in `supabase/migrations/`.
  * All database scripts must be **idempotent** (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `DROP POLICY IF EXISTS`).
  * Row Level Security (RLS) is compulsory on all public tables with explicit policies.
  * Direct data queries must always route through `SupabaseContentRepository`.

---

## 4. Authentication & Security Rules

* **Compulsory Admin Authentication**:
  * All administrative routes (`/admin/**`) require an active, authenticated Supabase session.
  * Unauthenticated requests to `/admin` routes are intercepted and redirected to `/admin/login` by proxy middleware (`proxy.ts`) and server-side checks.
  * Supported auth methods: OAuth (Google, GitHub), Email OTP, and WebAuthn Passkeys.
* **Public Routes**:
  * Public surfaces (`/`, `/about`, `/library`, `/scribble`, `/p/[slug]`, `/n/[slug]`, `/support`, `/fund`, `/now`) remain globally accessible.
* **Absolute Admin Isolation**:
  * Admin routes (`/admin`) must **NEVER** be exposed or linked in public sitemaps (`app/sitemap.ts`), robots.txt (`app/robots.ts`), navigation headers, footers, or JSON-LD structured schemas.

---

## 5. Design System & Editorial Guidelines

* **Editorial Ledger Aesthetic**:
  * Typographic, horizontal-ruled ledger design with high-contrast dark tones (`bg-night`, `text-paper`, `border-tinted/20`).
  * Typography uses Newsreader serif for long-form prose and Space Grotesk for technical metadata and UI elements.
  * **No boxed container cards with drop shadows**: Preserve the clean, horizontal ledger format.
* **Responsive & Accessible**:
  * Desktop-first editorial layout that scales cleanly to tablet and mobile viewports via responsive Tailwind CSS v4 utilities.
  * Ensure full keyboard navigability, semantic HTML, and correct ARIA states (`role="status"`, `aria-expanded`, etc.).

---

## 6. Environment & Secret Management

* **No Committed Secrets**:
  * Never commit `.env`, `.env.local`, API keys, or production credentials.
  * Document all environment variables in `.env.production.example` and `docs/environment.md`.
* **Server-Side Isolation**:
  * Private keys (`SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_SECRET`, `ADMIN_PASSWORD_HASH`) must never use the `NEXT_PUBLIC_` prefix and must never be imported into Client Components.
  * Always use `lib/config/env.ts` helper methods (`getSupabaseUrl()`, `getSupabaseSecretKey()`, `getSupabasePublishableKey()`) to safely resolve runtime credentials.

---

## 7. Development Commands & Verification

* **Dev Server**: `npm run dev`
* **Build**: `npm run build`
* **Linting**: `npm run lint`
* **Automated Tests**: `npm test` *(runs native test suite via `npx tsx --test tests/*.test.ts`)*
* **Node Version**: `>=24.16.0` *(enforced via `.nvmrc`: `24.18.0`)*

### Verification Mandate
Always run the full test suite and linter before declaring any task complete:
```bash
npm test
npm run lint
```
All tests must pass with zero errors and zero warnings.

---

## 8. Dev Server Rule (CRITICAL)

**Never kill or restart the dev server.** The dev server is running in the background.

* Do **not** kill any `next dev`, `next-server`, or related Node.js process.
* Do **not** delete or clear the `.next` directory — doing so breaks the running server.
* Do **not** run `npm run clean` or any command that removes build artifacts.
* Next.js Fast Refresh automatically detects and reloads file changes. Let it do its job.
* If a server restart is genuinely required, stop and ask — only the repository owner starts and stops the dev server.

---

## 9. Concurrent User Changes & Non-Destructive Git Policy (CRITICAL)

* **Never revert, overwrite, or discard user working changes.**
* The repository owner frequently makes edits and tweaks directly in the background while tasks are being performed.
* If uncommitted edits or modified files exist that you did not make, **they are intentional changes made by the user**.
* **Strictly forbidden actions**:
  * Never run `git checkout -- <file>`, `git restore <file>`, `git reset`, `git clean`, or any command to discard/revert uncommitted modifications unless explicitly instructed by the user.
  * Never overwrite or revert files that contain user edits.
* Always preserve and respect all user modifications and continue working alongside them seamlessly.

