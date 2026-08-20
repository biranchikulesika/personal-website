import assert from "node:assert/strict";
import { test } from "node:test";
import { resetDatabase } from "../lib/data/mock-db";
import { ContentService } from "../lib/services/content.service";

// ── Publication Lifecycle ───────────────────────────────────────────────────

test("published posts are accessible by slug", async () => {
  resetDatabase();
  const service = new ContentService();
  const post = await service.getPost("building-in-public-carefully");
  assert.ok(post, "published post should exist");
  // Seeded posts may not have explicit status; undefined is treated as published.
  assert.ok(post.status !== "unpublished", "post should not be unpublished");
});

test("unpublished posts are still accessible by slug (admin editing)", async () => {
  resetDatabase();
  const service = new ContentService();

  // Create unpublished post
  await service.savePost(
    {
      slug: "unpublished-lifecycle-test",
      title: "Unpublished Test",
      description: "Test",
      tags: [],
      publishedAt: "2026-08-20",
      lastEditedAt: "2026-08-20",
      assumedAudience: "Test",
      intro: [],
      sections: [],
      books: [],
      status: "unpublished",
    },
    "builder",
  );

  const post = await service.getPost("unpublished-lifecycle-test");
  assert.ok(post, "unpublished post should be retrievable by slug");
  assert.equal(post.status, "unpublished");
});

test("unpublished posts are excluded from sitemap", async () => {
  resetDatabase();
  const service = new ContentService();

  // Create unpublished post
  await service.savePost(
    {
      slug: "unpublished-sitemap-test",
      title: "Unpublished",
      description: "Test",
      tags: [],
      publishedAt: "2026-08-20",
      lastEditedAt: "2026-08-20",
      assumedAudience: "Test",
      intro: [],
      sections: [],
      books: [],
      status: "unpublished",
    },
    "builder",
  );

  const { default: sitemap } = await import("../app/sitemap");
  const entries = await sitemap();
  const urls = entries.map((e) => e.url);
  assert.ok(
    !urls.includes("https://biranchikulesika.com/p/unpublished-sitemap-test"),
    "unpublished post should not appear in sitemap",
  );
});

test("unpublished notes are excluded from sitemap", async () => {
  resetDatabase();
  const service = new ContentService();

  await service.saveNote({
    id: "note-unpublished-test",
    slug: "unpublished-note-sitemap-test",
    title: "Unpublished Note",
    description: "Test",
    content: ["Test content"],
    date: "2026-08-20",
    persona: "thinker",
    tags: [],
    status: "unpublished",
  });

  const { default: sitemap } = await import("../app/sitemap");
  const entries = await sitemap();
  const urls = entries.map((e) => e.url);
  assert.ok(
    !urls.includes(
      "https://biranchikulesika.com/n/unpublished-note-sitemap-test",
    ),
    "unpublished note should not appear in sitemap",
  );
});

test("toggle post status switches between published and unpublished", async () => {
  resetDatabase();
  const service = new ContentService();

  // First, save the post with explicit status to ensure consistent state.
  const post = await service.getPost("building-in-public-carefully");
  assert.ok(post);
  await service.savePost({ ...post, status: "published" }, "builder");

  const toggled = await service.togglePostStatus("building-in-public-carefully");
  assert.ok(toggled);
  assert.equal(toggled.status, "unpublished");

  const toggledBack = await service.togglePostStatus("building-in-public-carefully");
  assert.ok(toggledBack);
  assert.equal(toggledBack.status, "published");
});

test("default status is published when saving without explicit status", async () => {
  resetDatabase();
  const service = new ContentService();

  const saved = await service.savePost(
    {
      slug: "default-status-test",
      title: "Default Status",
      description: "Test",
      tags: [],
      publishedAt: "2026-08-20",
      lastEditedAt: "2026-08-20",
      assumedAudience: "Test",
      intro: [],
      sections: [],
      books: [],
    },
    "builder",
  );

  assert.equal(saved.status, "published", "default status should be published");
});

// ── Slug Lifecycle ──────────────────────────────────────────────────────────

test("slug is used as the URL identifier for posts", async () => {
  resetDatabase();
  const service = new ContentService();
  const slugs = await service.getPostSlugs();
  assert.ok(slugs.length > 0, "should have post slugs");

  // Each slug should be a valid URL segment
  for (const slug of slugs) {
    assert.ok(
      /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug),
      `slug "${slug}" should be kebab-case`,
    );
  }
});

test("slug is used as the URL identifier for notes", async () => {
  resetDatabase();
  const service = new ContentService();
  const slugs = await service.getNoteSlugs();
  assert.ok(slugs.length > 0, "should have note slugs");

  for (const slug of slugs) {
    assert.ok(
      /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug),
      `slug "${slug}" should be kebab-case`,
    );
  }
});

test("slug change breaks URL (documented production concern)", async () => {
  resetDatabase();
  const service = new ContentService();

  const original = await service.getPost("building-in-public-carefully");
  assert.ok(original);

  // Save with a different slug — this creates a new post, old one remains
  const updated = await service.savePost(
    { ...original, slug: "new-slug-for-test" },
    "builder",
  );
  assert.equal(updated.slug, "new-slug-for-test");

  // Original slug still exists (upsert creates new, doesn't rename)
  const stillExists = await service.getPost("building-in-public-carefully");
  assert.ok(stillExists, "original slug should still exist (no rename)");
});

// ── Date Consistency ────────────────────────────────────────────────────────

test("post dates are ISO format strings", async () => {
  resetDatabase();
  const service = new ContentService();
  const post = await service.getPost("building-in-public-carefully");
  assert.ok(post);

  // publishedAt should be a valid date string
  assert.ok(
    /^\d{4}-\d{2}-\d{2}$/.test(post.publishedAt),
    `publishedAt "${post.publishedAt}" should be ISO date format`,
  );
  assert.ok(
    /^\d{4}-\d{2}-\d{2}$/.test(post.lastEditedAt),
    `lastEditedAt "${post.lastEditedAt}" should be ISO date format`,
  );
});

test("note dates are ISO format strings", async () => {
  resetDatabase();
  const service = new ContentService();
  const notes = await service.getAllNotes();
  assert.ok(notes.length > 0);

  for (const note of notes) {
    assert.ok(
      /^\d{4}-\d{2}-\d{2}$/.test(note.date),
      `note date "${note.date}" should be ISO date format`,
    );
  }
});

test("book dates are year strings", async () => {
  resetDatabase();
  const service = new ContentService();
  const books = await service.getAllBooks();
  assert.ok(books.length > 0);

  for (const book of books) {
    assert.ok(
      /^\d{4}$/.test(book.date),
      `book date "${book.date}" should be year format`,
    );
  }
});

test("now entry dates are month strings", async () => {
  resetDatabase();
  const service = new ContentService();
  const entries = await service.getNowEntries();
  assert.ok(entries.length > 0);

  for (const entry of entries) {
    assert.ok(
      /^\d{4}-\d{2}$/.test(entry.date),
      `now entry date "${entry.date}" should be month format`,
    );
  }
});

// ── Content Integrity ───────────────────────────────────────────────────────

test("every published post has required fields", async () => {
  resetDatabase();
  const service = new ContentService();
  const posts = await service.getAllPosts();

  for (const post of posts) {
    assert.ok(post.slug, "post must have slug");
    assert.ok(post.title, "post must have title");
    assert.ok(post.description, "post must have description");
    assert.ok(post.publishedAt, "post must have publishedAt");
    assert.ok(post.lastEditedAt, "post must have lastEditedAt");
    assert.ok(Array.isArray(post.intro), "post intro must be array");
    assert.ok(Array.isArray(post.sections), "post sections must be array");
    assert.ok(Array.isArray(post.tags), "post tags must be array");
  }
});

test("every published note has required fields", async () => {
  resetDatabase();
  const service = new ContentService();
  const notes = await service.getAllNotes();

  for (const note of notes) {
    assert.ok(note.id, "note must have id");
    assert.ok(note.slug, "note must have slug");
    assert.ok(note.title, "note must have title");
    assert.ok(note.description, "note must have description");
    assert.ok(note.date, "note must have date");
    assert.ok(note.persona, "note must have persona");
    assert.ok(Array.isArray(note.content), "note content must be array");
    assert.ok(Array.isArray(note.tags), "note tags must be array");
  }
});

test("every book has required fields", async () => {
  resetDatabase();
  const service = new ContentService();
  const books = await service.getAllBooks();

  for (const book of books) {
    assert.ok(book.id, "book must have id");
    assert.ok(book.slug, "book must have slug");
    assert.ok(book.title, "book must have title");
    assert.ok(book.author, "book must have author");
    assert.ok(book.date, "book must have date");
    assert.ok(book.persona, "book must have persona");
  }
});

test("scribble entries aggregate all content types", async () => {
  resetDatabase();
  const service = new ContentService();
  const entries = await service.getScribbleEntries();

  const types = new Set(entries.map((e) => e.type));
  assert.ok(types.has("essay"), "scribble should include essays");
  assert.ok(types.has("note"), "scribble should include notes");
  assert.ok(types.has("book"), "scribble should include books");

  // Every entry should have a valid href
  for (const entry of entries) {
    assert.ok(entry.href, "scribble entry must have href");
    assert.ok(
      entry.href.startsWith("/p/") ||
        entry.href.startsWith("/n/") ||
        entry.href === "/library",
      `scribble href "${entry.href}" should be a valid route`,
    );
  }
});

test("delete operation removes content permanently", async () => {
  resetDatabase();
  const service = new ContentService();

  // Create and then delete a post
  await service.savePost(
    {
      slug: "delete-test-post",
      title: "Delete Test",
      description: "Test",
      tags: [],
      publishedAt: "2026-08-20",
      lastEditedAt: "2026-08-20",
      assumedAudience: "Test",
      intro: [],
      sections: [],
      books: [],
    },
    "builder",
  );

  const deleted = await service.deletePost("delete-test-post");
  assert.ok(deleted, "delete should return true");

  const post = await service.getPost("delete-test-post");
  assert.equal(post, null, "deleted post should not be retrievable");
});

test("media items have valid tag values", async () => {
  resetDatabase();
  const service = new ContentService();
  const media = await service.getMedia();

  const validTags = new Set(["profile", "atmosphere", "post", "book"]);
  for (const item of media) {
    assert.ok(
      validTags.has(item.tag),
      `media tag "${item.tag}" should be one of: ${[...validTags].join(", ")}`,
    );
  }
});
