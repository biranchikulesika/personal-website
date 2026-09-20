# Testing Architecture and Guidelines

The project uses Node.js's native test runner (`node:test`) paired with `node:assert/strict`, executed via `tsx`.

---

## 1. Test Architecture

- **Native Execution**: Tests run directly against TypeScript source files using `tsx` without separate build or compilation steps.
- **In-Memory Testing**: All service and business logic tests run against `InMemoryTestContentRepository`. Tests run entirely in memory without requiring a live database connection or Docker container.
- **Zero Production Data Impact**: Tests cannot pollute, overwrite, or mutate production data.

---

## 2. Test Suite Map

The test suite contains 15 test files covering 221 automated tests:

| Test File | Focus Area |
| :--- | :--- |
| **`tests/account-auth-security.test.ts`** | Admin session management, provider linking, and preventing disconnecting the last provider. |
| **`tests/content-lifecycle.test.ts`** | Post creation, editing, slug collision handling, and publication status toggles. |
| **`tests/contributions-razorpay.test.ts`** | Razorpay HMAC payment verification, webhook signatures, idempotency, and API route responses. |
| **`tests/dynamic-routes-security.test.ts`** | Dynamic parameter validation, sanitization, and 404 error handling. |
| **`tests/mdx.test.ts`** | Markdown section parsing, MDX evaluation, embedded components, and footnotes. |
| **`tests/newsletter.test.ts`** | Newsletter subscription validation, duplicate checking, and deletion. |
| **`tests/seo.test.ts`** | Metadata generation, canonical URLs, Twitter creator tags, and Schema.org JSON-LD structured data. |
| **`tests/server-actions-security.test.ts`** | Authorization checks on server actions ensuring unauthenticated callers fail closed. |
| **`tests/service-layer.test.ts`** | ContentService business logic, CRUD operations, and scribble aggregation. |
| **`tests/service-layer-extra.test.ts`** | Environment variable resolution and featured items curation. |
| **`tests/sitemap-robots.test.ts`** | Dynamic sitemap inclusion and exclusion rules, robots.txt directives, and admin route isolation. |
| **`tests/states.test.ts`** | UI state component props, accessibility roles, and default messaging. |
| **`tests/utils.test.ts`** | String helpers, date formatting, and kebab-case slugification. |
| **`tests/validation.test.ts`** | Zod input validation schemas for posts, notes, books, now entries, and media. |
| **`tests/webauthn-security.test.ts`** | WebAuthn challenge signing, cookie expiry, tampering detection, and replay prevention. |

---

## 3. Running Tests

```bash
# Run all tests
npm test

# Run a specific test file
npx tsx --test tests/contributions-razorpay.test.ts

# Run tests matching a specific pattern
npx tsx --test tests/*auth*.test.ts
```

---

## 4. How to Write a Test

When testing features that touch the data layer, inject `InMemoryTestContentRepository`:

```typescript
import assert from "node:assert/strict";
import { test } from "node:test";
import { ContentService } from "../lib/services/content.service";
import { InMemoryTestContentRepository } from "./in-memory-test-content-repository";

test("savePost creates and retrieves a post correctly", async () => {
  // 1. Arrange: instantiate the in-memory test repository
  const repo = new InMemoryTestContentRepository();
  const service = new ContentService(repo);

  // 2. Act: save the post
  const post = await service.savePost({
    slug: "my-test-essay",
    title: "My Test Essay",
    description: "Testing the service layer",
    tags: ["tech"],
    publishedAt: "2026-08-21",
    lastEditedAt: "2026-08-21",
    targetAudience: "Developers",
    intro: ["Hello world"],
    sections: [],
    books: [],
  });

  // 3. Assert: verify results
  assert.equal(post.slug, "my-test-essay");
  const retrieved = await service.getPost("my-test-essay");
  assert.ok(retrieved);
  assert.equal(retrieved.title, "My Test Essay");
});
```
