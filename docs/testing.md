# Testing Architecture & Guidelines

The project uses Node.js's native test runner (`node:test`) paired with `node:assert/strict` and executed via `tsx`.

---

## 1. Test Philosophy & Framework

- **Zero-Config & Blazing Fast**: No Jest/Vitest overhead or complex Babel transformations. Tests execute directly against TypeScript source files using `tsx`.
- **In-Memory Speed**: Unit tests use lightweight in-memory test stubs in milliseconds without spin-up lag or database containers.
- **Strict Invariant Testing**: Tests verify architectural rules, security boundaries, cryptographic signatures, schema integrity, and SEO compliance.

---

## 2. Test Suite Overview

| Test File | Focus Area |
| :--- | :--- |
| **`tests/content-service.test.ts`** | CRUD operations on posts, notes, books, now timeline, orphaned media detection, and RBAC roles. |
| **`tests/contributions-razorpay.test.ts`** | HMAC payment verification, webhook validation, event parsers, database idempotency, and API route responses. |
| **`tests/dynamic-routes-security.test.ts`** | Proxy middleware admin authentication guards and 404 handlers. |
| **`tests/mdx.test.ts`** | MDX AST transformations, section extraction, blockquote parsing, and footnotes. |
| **`tests/schema.test.ts`** | Schema constraint verification and cross-collection slug collisions. |
| **`tests/seo.test.ts`** | Metadata generation, canonical URLs, Twitter creator tags, and Schema.org JSON-LD structured data. |
| **`tests/sitemap-robots.test.ts`** | Dynamic sitemap inclusion/exclusion rules, robots.txt directives, and zero-admin leakage. |
| **`tests/states.test.ts`** | UI state component props, accessibility roles, and default messaging. |
| **`tests/utils.test.ts`** | String helpers, date formatting, and kebab-case slugification. |
| **`tests/validation.test.ts`** | Zod input validation schemas for posts, notes, books, now entries, media, and params. |

---

## 3. Running Tests

```bash
# Run the entire test suite
npm test

# Run a specific test file
npx tsx --test tests/contributions-razorpay.test.ts

# Run tests matching a specific pattern
npx tsx --test tests/*seo*.test.ts
```

---

## 4. How to Write a Test

Create a new test or add to an existing file in `tests/`:

```typescript
import assert from "node:assert/strict";
import { test } from "node:test";
import { ContentService } from "../lib/services/content.service";
import { InMemoryTestContentRepository } from "./in-memory-test-content-repository";

test("savePost creates and retrieves a post correctly", async () => {
  // 1. Arrange: Instantiate in-memory test repository
  const repo = new InMemoryTestContentRepository();
  const service = new ContentService(repo);

  // 2. Act: Save post
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

  // 3. Assert: Verify results
  assert.equal(post.slug, "my-test-essay");
  const retrieved = await service.getPost("my-test-essay");
  assert.ok(retrieved);
  assert.equal(retrieved.title, "My Test Essay");
});
```
