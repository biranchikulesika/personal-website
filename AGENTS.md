# AGENTS.md — Experimental Rebuild Branch

This file is the source of truth for agents working on this branch.

---

## 1. Branch Rules

This branch is **experimental and isolated**.

* Branch name: `experiment/rebuild-foundation`
* It must **never** be merged into `develop`, `main`, or `production`.
* It must **never** be pushed to remote unless the repository owner explicitly asks.
* Never directly modify `develop`, `main`, or `production`.
* Do not create accidental merge paths into protected branches.
* Do not cherry-pick commits from this branch into protected branches.
* This branch may eventually replace the existing implementation, but that
  decision is made later — not now.

The decision to promote anything from this branch is the repository owner's
alone. Do not create Pull Requests targeting protected branches from this
branch.

---

## 2. Product-Development Rules

The product requirements for this website are **intentionally incomplete** and
will be defined progressively by the repository owner.

* Do **not** invent major product requirements.
* Do **not** prematurely lock architecture around assumptions.
* Prefer flexible, replaceable architecture over fixed decisions.
* The owner will progressively define the product while development continues.
* Existing product decisions from the previous implementation are **not**
  authoritative. Do not reuse them unless the owner asks.

### Technical reset

This branch is a technical reset of the website implementation.

The previous implementation (persona architecture, page structure, component
hierarchy, database schema, service structure, authentication flow, UI design)
is removed and is **not** the source of truth.

Do not assume any of the following is required:

* the existing page structure
* the existing persona system
* the existing component hierarchy
* the existing database schema
* the existing service structure
* the existing authentication flow
* the existing UI design

Reuse existing dependencies or infrastructure only when technically useful.

---

## 3. Database Rules

This branch uses a **mock/local database only**.

* Use the in-memory mock database (`lib/data/mock-db.ts`).
* Do **not** connect to production data.
* Do **not** modify the production database.
* Do **not** treat the previous production schema as immutable.
* The schema is expected to evolve while requirements become clearer.
* Database changes must remain easy to modify or replace.

### Mock database

* Location: `lib/data/mock-db.ts`
* Reseed: `npm run db:reset` (runs `scripts/reset-db.ts`)
* The database is in-memory: it resets on process restart.
* Schema is deliberately provisional. Change it freely; keep it small.

---

## 4. Authentication Rules

Authentication is **disabled** on this branch.

* Do not build a production authentication flow.
* Do not add login/signup/auth middleware.
* The application must be usable without authentication while UI and product
  structure are developed.
* `lib/config/env.ts` guards against enabling auth: setting `AUTH_ENABLED=true`
  throws instead of enabling authentication.

---

## 5. Architecture Rules

Keep clean separation between the application/UI and data access:

```text
UI (React / Next.js app)
        ↓
Application / service layer   →  lib/services/
        ↓
Data access / repository layer →  lib/repositories/
        ↓
Mock database                  →  lib/data/
```

Rules:

* UI components must **not** query the database directly.
* UI components should call the service layer.
* The service layer contains application/business operations.
* The repository layer abstracts data access.
* Replacing the mock database later must not require rewriting the UI.
* Keep the architecture simple. Do not over-engineer.

Current structure (provisional):

* `lib/types.ts` — provisional domain types
* `lib/data/mock-db.ts` — mock database
* `lib/repositories/` — data access layer
* `lib/services/` — application layer
* `lib/config/env.ts` — environment / safety guards

---

## 6. Environment Rules

The development environment must never silently fall back to production.

* `DATA_SOURCE` must be `mock`. Any production value (`supabase`, `postgres`,
  `production`) causes the app to throw.
* `AUTH_ENABLED` must be `false`/unset.
* Do not add production credentials (Supabase, payment, AI keys, etc.) to
  `.env.example` or any committed file.
* Do not connect to production services of any kind.

The old `.env`/`.env.local` files from the previous implementation may still
exist locally. They are gitignored and must not be loaded or referenced by new
code on this branch.

---

## 7. Implementation Strategy — Desktop First

The website is built in this order:

* **Phase 1:** Desktop experience.
* **Phase 2:** Mobile experience.

While building Phase 1:

* Keep the layout technically responsive.
* Use responsive primitives and sensible layout constraints.
* Do not build desktop components in a way that makes mobile implementation
  unnecessarily difficult.
* Do **not** spend the current phase perfecting mobile UI.

---

## 8. Design System

Do not finalize the design system yet.

Do not lock:

* colors
* typography
* spacing scale
* persona themes
* animation language
* page hierarchy
* navigation structure
* content taxonomy

unless required by the current implementation. These decisions are discovered
progressively. Build the technical foundation so these can change easily.

---

## 9. Do Not Overbuild

At this stage, do **not**:

* build every page
* invent missing features
* create unnecessary APIs
* create unnecessary database tables
* implement authentication
* connect production services
* optimize prematurely
* create complicated abstractions
* preserve old product decisions just for compatibility

---

## 10. Commands

* Dev server: `npm run dev`
* Build: `npm run build`
* Lint: `npm run lint`
* Tests: `npm test`
* Reset mock db: `npm run db:reset`

Node version: `>=24.16.0` (use nvm: `nvm use 24.18.0`).

---

## 11. Dev Server Rule

**Never kill or restart the dev server.** The dev server may be running in the
background.

* Do **not** kill any `next dev`, `next-server`, or related process.
* Do **not** delete or clear the `.next` directory — doing so kills the server.
* Do **not** run `npm run clean` or anything that removes build artifacts.
* On change, the server reloads automatically (hot reload). Let it do its job.
* Do nothing that would kill the server. If a restart is genuinely required,
  stop and ask — only the repository owner starts and stops the dev server.
