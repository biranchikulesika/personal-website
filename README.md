# Biranchi Kulesika — Personal Website

Experimental rebuild in progress on branch `experiment/rebuild-foundation`.

This branch is a **technical reset**. Product requirements are intentionally
incomplete and are being defined progressively. The previous implementation is
preserved under `legacy/` for reference only.

## Current state

* Minimal Next.js (App Router) + TypeScript + Tailwind CSS v4 application.
* Mock in-memory database with reset/reseed capability.
* Clean service layer between the UI and data access.
* Authentication disabled by design.
* No production services, credentials, or data.

## Architecture

```text
UI (React / Next.js app)
        ↓
Application / service layer   →  lib/services/
        ↓
Data access / repository layer →  lib/repositories/
        ↓
Mock database                  →  lib/data/
```

## Commands

* `npm run dev` — start the dev server
* `npm run build` — production build
* `npm run lint` — lint
* `npm test` — tests
* `npm run db:reset` — reset/reseed the mock database

Node version: `>=24.16.0` (`nvm use 24.18.0`).

See `AGENTS.md` for the full set of branch rules and development guidelines.