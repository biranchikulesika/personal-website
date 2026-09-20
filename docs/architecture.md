# System Architecture

The application follows a 4-tier layered architecture. This separates the user interface, business rules, data abstraction, and database persistence.

---

## The 4-Tier Model

```text
┌─────────────────────────────────────────────────────────────┐
│                    1. Presentation / UI                     │
│  (Next.js App Router: app/(site), app/admin, components/)   │
└──────────────────────────────┬──────────────────────────────┘
                               │ Calls
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
│    - Typed database queries, row mappers, Supabase client   │
└──────────────────────────────┬──────────────────────────────┘
                               │ Interacts with
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               4. Database / Persistence Layer               │
│                    (Supabase PostgreSQL)                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Layer Descriptions and Responsibilities

### Tier 1: Presentation and UI Layer
- **Locations**: `app/(site)/**`, `app/admin/**`, `components/**`
- **Responsibilities**:
  - Render Server Components and Client Components.
  - Handle user events, client state, and form interactions.
  - Call Server Actions (`app/admin/actions.ts`) or query the Service Layer directly inside async Server Components.
  - Return HTTP responses and render error or not-found boundaries.
- **Rule**: UI components must never import database drivers, execute SQL, or access Supabase clients directly.

### Tier 2: Application and Service Layer
- **Locations**: `lib/services/` (`ContentService`, `AiMetadataService`, `PexelsService`)
- **Responsibilities**:
  - Encapsulate business logic, transformations, and workflows.
  - Coordinate per-request query deduplication using `React.cache()`.
  - Verify cryptographic signatures for Razorpay payments and webhooks.
  - Aggregate cross-collection data, such as merging published posts and notes in `getScribbleEntries()`.
  - Coordinate Next.js path revalidation via Server Actions.
- **Rule**: The service layer never contains JSX markup or direct database drivers. It works only with domain models defined in `lib/types.ts`.

### Tier 3: Repository and Data Access Layer
- **Location**: `lib/repositories/`
- **Files**:
  - `content.repository.ts`: TypeScript interface defining all data operations.
  - `supabase-content.repository.ts`: PostgreSQL implementation using Supabase client.
  - `index.ts`: Factory returning the active repository instance.
- **Responsibilities**:
  - Execute database queries, inserts, updates, and deletes.
  - Map PostgreSQL rows in snake_case to domain types in camelCase.
  - Enforce cross-collection slug uniqueness and avoid duplicate records.
- **Rule**: Repositories do not perform business operations such as verifying signatures. They only store and fetch data.

### Tier 4: Database and Persistence Layer
- **Database**: Supabase PostgreSQL.
- **Schema**: Single idempotent schema file located at `supabase/migrations/20260830000000_initial_schema.sql`.

---

## 2. Data Flow Examples

### Read Request (Viewing an Essay)
1. The browser requests `/p/some-essay-slug`.
2. Next.js runs the Server Component at `app/(site)/p/[slug]/page.tsx`.
3. The page calls `contentService.getPost('some-essay-slug')`.
4. `ContentService` checks its `React.cache()` memoized function and calls `repository.getPost('some-essay-slug')`.
5. `SupabaseContentRepository` queries the `posts` table in PostgreSQL.
6. The repository maps the database row to a `BlogPost` domain object.
7. The page renders metadata, injects JSON-LD structured data, and returns HTML with `<BlogPostView post={post} />`.

### Write Request (Saving a Post from Admin)
1. An administrator edits content in the composer at `/admin/compose`.
2. Clicking save triggers `savePostAction(postData)` in `app/admin/actions.ts`.
3. `assertAdminUser()` verifies the user is authenticated and holds the `content_admin` or `super_admin` role in `user_roles`.
4. `validateInput(BlogPostSchema, postData)` validates the payload using Zod.
5. The action calls `contentService.savePost(validatedPost)`.
6. `SupabaseContentRepository` upserts the record into the `posts` table.
7. The action calls `revalidatePath()` for `/admin`, `/scribble`, and `/p/[slug]`.
8. The response returns success to the browser.

### Webhook Event (Razorpay Payment)
1. Razorpay sends an HTTP POST request to `/api/webhooks/razorpay`.
2. The route handler extracts the raw body and the `X-Razorpay-Signature` header.
3. `contentService.processRazorpayWebhook(rawBody, signature)` validates the HMAC-SHA256 signature using `lib/razorpay.ts`.
4. The event is parsed into a `Contribution` domain object.
5. `ContentRepository` records the contribution in the `contributions` table idempotently.
6. The endpoint returns `{ status: 'ok', received: true }`.

---

## 3. Architectural Rules

| Principle | Correct Location | Forbidden Location |
| :--- | :--- | :--- |
| **Input Validation** | Zod schemas in `lib/validation.ts` and Server Actions | Client components only |
| **Cryptographic Verification** | `lib/razorpay.ts` and `lib/services/` | Route handlers or UI components |
| **Database Queries** | `lib/repositories/*` | UI components or page files |
| **Domain Types** | `lib/types.ts` | Ad-hoc definitions inside `.tsx` components |
| **Search Engine and OG Metadata** | `lib/seo.ts` and route `generateMetadata` | Hardcoded inside layout templates |
| **Environment Variable Access** | `lib/config/env.ts` | Scattered `process.env` lookups |
