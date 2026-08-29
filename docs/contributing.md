# Contributing & Developer Guides

This document provides step-by-step practical guides for developers extending or modifying the codebase.

---

## 1. Development Workflow

### Prerequisites
- Node.js `>= 24.16.0` (`nvm use 24.18.0`)
- `npm`

### Daily Commands
```bash
# 1. Start development server (Hot Reload active)
npm run dev

# 2. Run test suite
npm test

# 3. Check linter rules
npm run lint

# 4. Compile production build
npm run build
```

> [!IMPORTANT]
> **Dev Server Rule**: Never kill or restart the dev server process if running in paired agent environments. Hot reloading automatically picks up all file modifications.

---

## 2. Core Architectural Rules

1. **Layer Separation**: UI components (`components/`) must **never** connect to databases directly. Always go through `ContentService`.
2. **Repository Consistency**: Every data operation must be declared in `ContentRepository` and implemented in `SupabaseContentRepository`.
3. **Admin Privacy**: Never expose admin routes (`/admin`) in public sitemaps, robots.txt, navigation headers, or JSON-LD.
4. **Idempotency**: All database changes in `supabase/schema.sql` and payment/webhook mutations must be idempotent.
5. **No Card Boxes**: Adhere to the editorial, horizontal-ruled ledger aesthetic. Do not introduce boxed container cards with arbitrary shadows.

---

## 3. Step-by-Step Developer How-To Guides

---

### Guide 1: Adding a New Page

#### Step 1: Create the Page Route in `app/(site)/`
Create `app/(site)/projects/page.tsx`:
```typescript
import type { Metadata } from 'next';
import { ContentService } from '@/lib/services/content.service';
import { SITE_URL } from '@/lib/constants';
import { ProjectsPageView } from '@/components/projects-page';

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Open source tools, software experiments, and systems.',
  alternates: { canonical: `${SITE_URL}/projects` },
};

export default async function ProjectsPage() {
  const service = new ContentService();
  const projects = await service.getProjects(); // If dynamic

  return <ProjectsPageView projects={projects} />;
}
```

#### Step 2: Build the UI View in `components/`
Create `components/projects-page.tsx`:
```typescript
export function ProjectsPageView({ projects }) {
  return (
    <div className="container-site py-12">
      <h1 className="font-serif text-3xl font-normal text-paper">Projects</h1>
      {/* Editorial layout */}
    </div>
  );
}
```

#### Step 3: Add to Navigation & Sitemap
- Add link in `lib/config/site.ts` (`nav.links` or `footer.columns`).
- Add entry to static routes array in `app/sitemap.ts`.

---

### Guide 2: Adding a New Database Table & Entity

#### Step 1: Update `supabase/schema.sql`
Add the table definition idempotently:
```sql
CREATE TABLE IF NOT EXISTS public.projects (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  url         TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read all projects" ON public.projects;
CREATE POLICY "Public read all projects" ON public.projects FOR SELECT USING (true);
```

#### Step 2: Define Domain Types in `lib/types.ts`
```typescript
export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  url?: string;
  createdAt: string;
}
```

#### Step 3: Update `lib/supabase/database.types.ts`
Add the row and insert types for `projects` under `Database['public']['Tables']`.

#### Step 4: Update Repository & Service
- Add `getProjects()` to `lib/repositories/content.repository.ts`.
- Implement in `lib/repositories/supabase-content.repository.ts`.
- Expose via `lib/services/content.service.ts`.

#### Step 5: Add Unit Tests in `tests/`
Write a test in `tests/content-service.test.ts` verifying that `getProjects()` retrieves records.

---

### Guide 3: Adding a New Shared UI Primitive

1. Place the component in `components/ui/` (e.g. `components/ui/tooltip.tsx`).
2. Adhere to the design system:
   - Use Tailwind CSS variables (`bg-night-soft`, `text-paper`, `border-tinted/20`).
   - Use `clsx` and `tailwind-merge` via `cn()` for class merging.
   - Ensure keyboard accessibility (`tabIndex`, ARIA attributes).
3. Export from `components/ui/` for consumption across site and admin views.

---

### Guide 4: Adding a Third-Party API Integration

1. **Keep Secrets Server-Side**:
   - Store API keys in environment variables (without `NEXT_PUBLIC_` prefix).
   - Document the variable in `docs/environment.md` and `.env.production.example`.
2. **Encapsulate in Service Layer**:
   - Create a dedicated service or helper in `lib/` (e.g. `lib/services/analytics.service.ts`).
   - Perform network calls, retries, and data parsing within the helper.
3. **Server-Side Invocation**:
   - Call the integration from Server Components, Server Actions (`app/admin/actions.ts`), or Route Handlers (`app/api/**`).
   - Never import server API keys inside Client Components.
