# System Architecture

The Biranchi Kulesika platform follows a strict **4-tier layered architecture**. This ensures clean boundaries between presentation, business rules, data abstraction, and storage mechanisms.

---

## The 4-Tier Layer Model

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
│    - Typed database queries, row mappers, Supabase queries  │
└──────────────────────────────┬──────────────────────────────┘
                               │ Interacts with
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               4. Database / Persistence Layer               │
│                    (Supabase PostgreSQL)                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Layer Descriptions & Responsibilities

### Tier 1: Presentation & UI Layer
- **Locations**: `app/(site)/**`, `app/admin/**`, `components/**`
- **Responsibilities**:
  - Render Server and Client Components.
  - Handle user events, form submissions, and UI state (modals, dropdowns, tabs).
  - Invoke Server Actions (`app/admin/actions.ts`) or query Service Layer directly inside async Server Components.
  - Return HTTP responses and render error / not-found boundaries.
- **Strict Boundary**: UI components **MUST NEVER** import database clients, execute SQL, or access `@supabase/supabase-js` directly.

### Tier 2: Application / Service Layer
- **Location**: `lib/services/` (e.g. `ContentService`)
- **Responsibilities**:
  - Encapsulate domain logic, transformations, and business rules.
  - Cryptographic verification (Razorpay payment signatures, webhook validation).
  - Cross-collection content aggregation (e.g. `getScribbleEntries()` merging posts, notes, and books).
  - Route revalidation coordination.
- **Strict Boundary**: Does not contain presentation markup (JSX/HTML) or raw database drivers. It operates purely on domain models (`lib/types.ts`).

### Tier 3: Repository / Data Access Layer
- **Location**: `lib/repositories/`
- **Files**:
  - `content.repository.ts`: TypeScript interface defining all data operations.
  - `supabase-content.repository.ts`: Supabase PostgreSQL implementation mapping database rows to domain types.
  - `index.ts`: Repository export providing `getContentRepository()`.
- **Responsibilities**:
  - Execute database queries, upserts, deletes, and transactions.
  - Map raw database rows to domain entities (`BlogPost`, `NoteItem`, `BookItem`, `Contribution`).
  - Enforce cross-collection slug uniqueness and idempotency deduplication.
- **Strict Boundary**: Repositories do not perform business operations (e.g., they do not verify webhook signatures or calculate payment taxes); they only store and retrieve.

### Tier 4: Database / Persistence Layer
- **Database**: Supabase PostgreSQL with schema defined in [`supabase/schema.sql`](file:///home/biranchikulesika/Projects/biranchi/supabase/schema.sql).

---

## Data Flow Examples

### Read Request (Server Component Rendering an Essay)
1. Browser requests `/p/some-essay-slug`.
2. Next.js executes `app/(site)/p/[slug]/page.tsx` (Server Component).
3. `PostPage` calls `new ContentService().getPost('some-essay-slug')`.
4. `ContentService` delegates to `repository.getPost('some-essay-slug')`.
5. `SupabaseContentRepository` queries the `posts` table and returns a typed `BlogPost`.
6. `PostPage` generates JSON-LD structured data and renders `<BlogPostView post={post} />`.

### Write Request (Admin Saves a Post via Server Action)
1. Admin edits Markdown in `components/admin/compose/compose-workspace.tsx`.
2. User clicks "Save & Publish".
3. Form triggers `savePostAction(postData)` in `app/admin/actions.ts`.
4. `savePostAction` validates input against `BlogPostSchema` (Zod).
5. `savePostAction` calls `contentService.savePost(validatedPost)`.
6. `ContentRepository` upserts the record into the database.
7. `savePostAction` triggers `revalidatePath('/p/' + slug)` and `revalidatePath('/scribble')`.
8. Result is returned to the client UI.

### Webhook Event (Razorpay Payment Captured)
1. Razorpay sends HTTP POST to `/api/webhooks/razorpay`.
2. Route handler extracts raw body and `X-Razorpay-Signature`.
3. Calls `contentService.processRazorpayWebhook(rawBody, signature)`.
4. `ContentService` verifies HMAC-SHA256 signature using `lib/razorpay.ts`.
5. Event is parsed into a `Contribution` domain object.
6. `ContentRepository` idempotently records or updates the contribution without inserting duplicate records.
7. Webhook responds with `{ status: 'ok', received: true }`.

---

## Architectural Rules & Guardrails

| Principle | Correct Location | Forbidden Location |
| :--- | :--- | :--- |
| **Input Validation** | Zod schemas in `lib/validations.ts` & Server Actions | Client components only |
| **Cryptographic Hashing / Verification** | `lib/razorpay.ts` / `lib/services/` | Route handlers or UI components |
| **Direct DB Querying** | `lib/repositories/*` | UI components or page files |
| **Domain Type Definitions** | `lib/types.ts` | Ad-hoc definitions inside `.tsx` components |
| **Search Engine & OG Metadata** | `lib/seo.ts` & route `generateMetadata` | Hardcoded inside layout templates |
| **Environment Variable Guards** | `lib/config/env.ts` | Scattered `process.env` lookups |
