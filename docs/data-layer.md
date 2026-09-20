# Data Layer Architecture

The data layer separates application operations from storage engines. UI components and Server Actions interact solely with the Service Layer (`ContentService`), which delegates to a repository conforming to the `ContentRepository` interface.

---

## 1. Repository Abstraction

```text
┌────────────────────────────────────────────────────────┐
│               ContentService (Application)             │
│                 lib/services/content.service.ts        │
└───────────────────────────┬────────────────────────────┘
                            │ Calls repository methods
                            ▼
┌────────────────────────────────────────────────────────┐
│          ContentRepository (Interface Contract)        │
│          lib/repositories/content.repository.ts        │
└───────────────────────────┬────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│ SupabaseContentRepository │   │InMemoryTestContentRepo... │
│ (PostgreSQL / Production) │   │(In-Memory / Unit Tests)   │
└───────────────────────────┘   └───────────────────────────┘
```

The application provides two implementations of the `ContentRepository` interface:
1. **`SupabaseContentRepository`**: The production repository connecting to Supabase PostgreSQL using `getSupabaseAdmin()`.
2. **`InMemoryTestContentRepository`**: The test repository used during `npm test`. It holds records in in-memory arrays and sets, enabling fast tests with zero database setup.

The repository factory in `lib/repositories/index.ts` returns the singleton instance:

```typescript
export function getContentRepository(): ContentRepository {
  if (!repository) {
    repository = new SupabaseContentRepository();
  }
  return repository;
}
```

---

## 2. Row Mapping and Type Conversion

Database columns in PostgreSQL follow `snake_case` conventions, while domain entities in `lib/types.ts` follow `camelCase` conventions.

`SupabaseContentRepository` isolates this mapping inside private mapper functions:

- **`postRowToDomain`**: Maps `published_at` to `publishedAt`, `last_edited_at` to `lastEditedAt`, `cover_image` to `coverImage`, and extracts JSONB `intro`, `sections`, and `books`.
- **`noteRowToDomain`**: Maps note records, deserializing JSON array content.
- **`bookRowToDomain`**: Converts reading records, normalizing `is_published` booleans.
- **`nowRowToDomain`**: Maps timeline updates, resolving `location`, `status`, and `last_edited_at`.
- **`mediaRowToDomain`**: Normalizes tags, filtering out legacy categories and mapping `created_at` or `uploaded_at` to `uploadedAt`.

This design ensures database schema changes only require updates in the repository mappers, leaving the rest of the application unchanged.

---

## 3. Per-Request Query Deduplication

During a single Next.js page request, multiple Server Components and `generateMetadata()` often request the same content item (for example, fetching the same post for page title generation and page body rendering).

`ContentService` wraps repository read methods with `React.cache()`:

```typescript
const getCachedPost = cache((repo: ContentRepository, slug: string) => repo.getPost(slug));
const getCachedNote = cache((repo: ContentRepository, slug: string) => repo.getNote(slug));
const getCachedHomeContent = cache((repo: ContentRepository) => repo.getHomeContent());
```

Because `React.cache()` memoizes values per request lifetime, the application makes only one database call per entity per request. Subsequent calls within the same render pass return the cached domain object without extra network roundtrips.

---

## 4. Cross-Collection Slug Invariants

Slugs for posts, notes, and books must be unique across all three collections to prevent routing collisions.

The repository enforces this at two levels:
1. **Application Level**: `saveNote` and `saveBook` check for conflicting slugs in the other collections before inserting.
2. **Database Level**: The PostgreSQL trigger function `check_cross_collection_slug_uniqueness` runs before insert or update on `posts`, `notes`, and `books`, raising an exception if a collision is detected.
