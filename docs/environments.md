# Production & Development Environment Separation Guide

This document defines the architectural boundaries and operational rules separating **Development**, **Testing / CI**, and **Production** in this repository.

---

## 1. Architectural Mental Model

```text
┌────────────────────────────────────────────────────────┐
│ 1. Development (Developer Machine)                     │
│    - Full source code, test suites, scripts/, docs/   │
│    - All dependencies (dependencies + devDependencies) │
│    - Local Supabase CLI container (mock public data)   │
└───────────────────────────┬────────────────────────────┘
                            │ git push
                            ▼
┌────────────────────────────────────────────────────────┐
│ 2. CI / Validation (GitHub Actions / Vercel Preview)   │
│    - npm ci (deterministic installation)               │
│    - Automated test suite (in-memory repository mock)  │
│    - Linter (ESLint) & Typechecker (tsc --noEmit)      │
│    - Production build verification                     │
└───────────────────────────┬────────────────────────────┘
                            │ PASS
                            ▼
┌────────────────────────────────────────────────────────┐
│ 3. Production Artifact Generation                      │
│    - output: 'standalone' in next.config.ts            │
│    - Artifact: .next/standalone + .next/static + public│
│    - 0 test files, 0 devDependencies, 0 dev tools      │
└───────────────────────────┬────────────────────────────┘
                            │ deploy
                            ▼
┌────────────────────────────────────────────────────────┐
│ 4. Production Host (Vercel Serverless or Standalone VPS│
│    - Runtime: Node.js (node server.js) or Edge CDN     │
│    - Production environment variables only             │
│    - Authoritative live Supabase database              │
└────────────────────────────────────────────────────────┘
```

The core principle:
- **The repository is the source of truth** for all code, tests, docs, and development tooling.
- **CI validates the software** without modifying or pointing to production data.
- **Production runs only the minimal, validated runtime artifact**. The production server is **never** treated as another development machine.

---

## 2. Environment Comparison Matrix

| Dimension | Local Development | Testing / CI | Production Host |
| :--- | :--- | :--- | :--- |
| **Dependencies** | Full (`dependencies` + `devDependencies`) | Full (`npm ci`) | Minimal runtime only (`.next/standalone/node_modules`) |
| **Database** | Local Supabase container (`localhost:54322`) | In-memory mock (`InMemoryTestContentRepository`) | Live remote Supabase (`ojzxdgzkrjmfeqyxvfud`) |
| **Environment File** | `.env.local` (gitignored, local secrets) | CI secret vault / environment variables | Host dashboard secrets (e.g. Vercel, systemd env) |
| **Test Files Present** | Yes (`tests/`) | Yes (`tests/`) | **No** (never copied or bundled) |
| **Dev Scripts Present** | Yes (`scripts/sync-live-data.sh`) | Yes | **No** (never copied or bundled) |
| **TypeScript Compiler** | Yes (`typescript`, `tsc`) | Yes (`npm run typecheck`) | **No** (pre-compiled to JS chunks) |
| **Linter** | Yes (`eslint`) | Yes (`npm run lint`) | **No** |

---

## 3. Directory & File Classification

### Development & Testing Only (Never Shipped to Production)
These files exist solely to help developers write, verify, and document code:
- **`tests/`**: All 15 test files, test fixtures (`fixtures.ts`), and the in-memory repository mock (`in-memory-test-content-repository.ts`).
- **`scripts/`**: Developer automation scripts like `sync-live-data.sh` (used to pull live content into the local database).
- **`docs/`**: Engineering documentation, architecture notes, and guides.
- **`supabase/`**: Local Supabase CLI configuration (`config.toml`), local migrations, and CLI cache (`.temp`, `.branches`).
- **`.github/`**: Workflow files and CI definitions.
- **Tooling Configuration**: `eslint.config.mjs`, `tsconfig.json`, `postcss.config.mjs`, `.nvmrc`.
- **Local Secret Overrides**: `.env.local`, `.env.*.local`.

### Production Runtime Only (What Shipped Artifacts Contain)
When building for production (`next build` with `output: 'standalone'`), Next.js traces all dependencies and outputs a standalone bundle containing **only** what is necessary:
- **`.next/standalone/server.js`**: Lightweight Node.js server entry point (~8 KB).
- **`.next/standalone/.next/`**: Server-side page bundles and route manifests.
- **`.next/standalone/node_modules/`**: Traced production dependencies only (~75 MB instead of >600 MB development `node_modules`).
- **`public/`**: Static image assets, favicon, web manifest, robots.txt, sitemap.
- **`.next/static/`**: Client-side CSS and JS bundles.

---

## 4. Dependencies Breakdown

### Production Runtime Dependencies (`dependencies` in `package.json`)
Every dependency listed under `dependencies` is imported and used directly during production request execution:

1. **`next`**, **`react`**, **`react-dom`**: Application runtime and React Server Components.
2. **`@supabase/supabase-js`**, **`@supabase/ssr`**: Authoritative database queries, media management, and cookie-based authentication.
3. **`@simplewebauthn/browser`**, **`@simplewebauthn/server`**: Passkey authentication flows.
4. **`@mdx-js/mdx`**, **`remark-gfm`**, **`js-yaml`**: Dynamic compilation of Markdown and MDX posts.
5. **`sharp`**: High-performance image processing and optimization.
6. **`zod`**: Runtime input and schema validation.
7. **`@vercel/speed-insights`**: Real-user performance telemetry in production.

### Development & Build Tools (`devDependencies` in `package.json`)
These packages are required only to build, lint, and test the project:

1. **`typescript`**, **`@types/*`**: Type annotations and compile-time typechecking.
2. **`tailwindcss`**, **`@tailwindcss/postcss`**, **`@tailwindcss/typography`**: Build-time CSS compilation.
3. **`eslint`**, **`eslint-config-next`**: Static code quality analysis.
4. **`tsx`**: Native TypeScript execution for the local test runner.

---

## 5. Environment Variables & Secrets

### Separation Hierarchy

```text
.env.local              Local developer overrides (never committed to Git)
.env.example            Committed developer template (safe sample values)
.env.production.example Committed production deployment checklist
Production Host Env     Injected via hosting dashboard / secure key-vault
```

### Safety Rules
1. **Never commit secrets**: Keys such as `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_SECRET`, or `ADMIN_PASSWORD_HASH` must never appear in any committed file or Git history.
2. **Client vs. Server Isolation**: Only variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. All other variables remain strictly on the server.
3. **Test Isolation**: Automated unit and integration tests run against [`InMemoryTestContentRepository`](file:///home/biranchi/Projects/biranchi/tests/in-memory-test-content-repository.ts). Running `npm test` requires no database connection and cannot accidentally corrupt or leak production data.

---

## 6. How Tests Are Run

Tests use the native Node.js test runner (`node:test` + `node:assert`) with `tsx`:

```bash
# Run all automated tests
npm test

# Run static linting
npm run lint

# Run compile-time TypeScript typechecking
npm run typecheck
```

All 221 tests run in memory and complete in under 3 seconds with zero external database dependencies.

---

## 7. How the Production Build Is Created

The application uses Next.js Turbopack with standalone output enabled in [`next.config.ts`](file:///home/biranchi/Projects/biranchi/next.config.ts):

```bash
# Generate production build
npm run build
```

During the build:
1. TypeScript compiler checks all types (`tsc`).
2. Server Actions and API routes are bundled.
3. Static Site Generation (SSG) pre-renders pages (`/library`, `/now`, etc.) using live Supabase credentials.
4. Traced production files are output to `.next/standalone`.

---

## 8. What Belongs on the Production Server

### If Deploying on Vercel (Current Primary Platform)
Vercel handles build and deployment automatically via Git integration:
- Vercel compiles the build in an isolated build container.
- Serves static assets from the global Edge CDN.
- Runs dynamic routes in lightweight serverless runtimes.
- Test files and development dependencies are omitted from serverless function bundles automatically.

### If Deploying on a Standalone Host / VPS (e.g. Linux VPS / Docker)
If you deploy this application onto a VPS, **do not clone the Git repository and run `npm install` on the server**. Instead, deploy the standalone production artifact:

#### 1. Build and Package the Artifact (in CI or Build Machine):
```bash
# 1. Install all dependencies and build
npm ci
npm run build

# 2. Copy static files into the standalone directory
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/
```

#### 2. Copy Only the Standalone Directory to Production:
Copy `.next/standalone` to your production server (e.g., `/var/www/biranchi`):
```bash
rsync -avz --delete .next/standalone/ user@your-vps:/var/www/biranchi/
```

#### 3. Run the Application in Production:
On the production server, only Node.js is required. No `npm install`, no `git`, no development tools:
```bash
cd /var/www/biranchi
PORT=3000 HOSTNAME=0.0.0.0 node server.js
```

### What Must NEVER Be Copied to Production
- `tests/`
- `scripts/`
- `docs/`
- `supabase/`
- `.git/`
- `node_modules/` from developer machine
- `.env.local`
- `eslint.config.mjs`, `tsconfig.json`

---

## 9. How to Reproduce and Test the Standalone Build Locally

You can test the standalone production runtime locally in 3 steps:

```bash
# Step 1: Build standalone
npm run build

# Step 2: Prepare static assets
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/

# Step 3: Run the standalone server
PORT=3005 HOSTNAME=127.0.0.1 node .next/standalone/server.js
```

Open `http://localhost:3005` in your browser. The application will serve production-optimized HTML, CSS, and server actions using only the standalone bundle.
