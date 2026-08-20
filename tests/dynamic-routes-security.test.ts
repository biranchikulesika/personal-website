import assert from "node:assert/strict";
import { test } from "node:test";
import { resetDatabase } from "../lib/data/mock-db";
import { ContentService } from "../lib/services/content.service";

// ── Dynamic Route: /p/[slug] ────────────────────────────────────────────────

test("post page returns data for valid published slug", async () => {
  resetDatabase();
  const service = new ContentService();
  const post = await service.getPost("building-in-public-carefully");

  assert.ok(post, "published post should exist");
  assert.equal(post.title, "Building in public, carefully");
  assert.ok(post.sections.length > 0, "post should have sections");
  assert.ok(post.intro.length > 0, "post should have intro paragraphs");
});

test("post page returns null for invalid slug", async () => {
  resetDatabase();
  const service = new ContentService();
  const post = await service.getPost("nonexistent-slug-xyz");

  assert.equal(post, null, "nonexistent post should return null");
});

test("post page handles unpublished posts correctly", async () => {
  resetDatabase();
  const service = new ContentService();

  // Create unpublished post
  const unpublished = {
    slug: "unpublished-test-post",
    title: "Unpublished",
    description: "Draft post",
    tags: ["test"],
    publishedAt: "2026-08-20",
    lastEditedAt: "2026-08-20",
    assumedAudience: "Test",
    intro: [],
    sections: [],
    books: [],
    status: "unpublished" as const,
  };
  await service.savePost(unpublished, "builder");

  // Post should still be retrievable by slug (for admin editing)
  const post = await service.getPost("unpublished-test-post");
  assert.ok(post, "unpublished post should still be retrievable");
  assert.equal(post!.status, "unpublished");
});

// ── Dynamic Route: /n/[slug] ────────────────────────────────────────────────

test("note page returns data for valid slug", async () => {
  resetDatabase();
  const service = new ContentService();
  const notes = await service.getAllNotes();
  assert.ok(notes.length > 0, "should have seeded notes");

  const note = await service.getNote(notes[0].slug);
  assert.ok(note, "note should exist");
  assert.equal(note!.slug, notes[0].slug);
});

test("note page returns null for invalid slug", async () => {
  resetDatabase();
  const service = new ContentService();
  const note = await service.getNote("nonexistent-note-xyz");

  assert.equal(note, null, "nonexistent note should return null");
});

// ── Post Slugs for Static Generation ────────────────────────────────────────

test("getPostSlugs returns all post slugs for static generation", async () => {
  resetDatabase();
  const service = new ContentService();
  const slugs = await service.getPostSlugs();

  assert.ok(slugs.length > 0, "should return at least one slug");
  assert.ok(
    slugs.includes("building-in-public-carefully"),
    "should include the featured post slug",
  );
  // All slugs should be strings
  assert.ok(
    slugs.every((s) => typeof s === "string" && s.length > 0),
    "all slugs should be non-empty strings",
  );
});

test("getNoteSlugs returns all note slugs for static generation", async () => {
  resetDatabase();
  const service = new ContentService();
  const slugs = await service.getNoteSlugs();

  assert.ok(slugs.length > 0, "should return at least one slug");
  assert.ok(
    slugs.every((s) => typeof s === "string" && s.length > 0),
    "all slugs should be non-empty strings",
  );
});

// ── Security: Slug Collision Prevention ──────────────────────────────────────

test("cannot create post with slug that exists as a note", async () => {
  resetDatabase();
  const service = new ContentService();

  const notes = await service.getAllNotes();
  const existingNoteSlug = notes[0].slug;

  const conflictingPost = {
    slug: existingNoteSlug,
    title: "Conflicting Post",
    description: "Should fail",
    tags: ["test"],
    publishedAt: "2026-08-20",
    lastEditedAt: "2026-08-20",
    assumedAudience: "Test",
    intro: [],
    sections: [],
    books: [],
  };

  await assert.rejects(
    () => service.savePost(conflictingPost, "builder"),
    /already exists/,
    "should reject post with slug conflicting with existing note",
  );
});

test("cannot create note with slug that exists as a post", async () => {
  resetDatabase();
  const service = new ContentService();

  const posts = await service.getAllPosts();
  const existingPostSlug = posts[0].slug;

  const conflictingNote = {
    id: "conflict-note",
    slug: existingPostSlug,
    title: "Conflicting Note",
    description: "Should fail",
    content: ["Body"],
    date: "2026-08-20",
    persona: "thinker" as const,
    tags: ["test"],
  };

  await assert.rejects(
    () => service.saveNote(conflictingNote),
    /already exists/,
    "should reject note with slug conflicting with existing post",
  );
});

test("cannot create book with slug that exists as a post", async () => {
  resetDatabase();
  const service = new ContentService();

  const posts = await service.getAllPosts();
  const existingPostSlug = posts[0].slug;

  const conflictingBook = {
    id: "conflict-book",
    slug: existingPostSlug,
    title: "Conflicting Book",
    author: "Author",
    description: "Should fail",
    date: "2026",
    persona: "thinker" as const,
    tags: ["test"],
  };

  await assert.rejects(
    () => service.saveBook(conflictingBook),
    /already exists/,
    "should reject book with slug conflicting with existing post",
  );
});

test("updating existing record with same slug does not trigger collision", async () => {
  resetDatabase();
  const service = new ContentService();

  const existingPost = await service.getPost("building-in-public-carefully");
  assert.ok(existingPost);

  // Updating with the same slug should succeed
  const updated = await service.savePost(
    { ...existingPost, title: "Updated Title" },
    "builder",
  );
  assert.equal(updated.title, "Updated Title");
});

// ── Security: authStatus Cannot Be Modified via Profile Update ───────────────

test("updateAdminProfile strips authStatus field", async () => {
  resetDatabase();
  const service = new ContentService();

  const originalProfile = await service.getAdminProfile();
  assert.equal(originalProfile.authStatus, "developer_mode");

  // Attempt to modify authStatus
  await service.updateAdminProfile({ authStatus: "enabled" });

  const updatedProfile = await service.getAdminProfile();
  assert.equal(
    updatedProfile.authStatus,
    "developer_mode",
    "authStatus should not be modifiable through updateAdminProfile",
  );
});

test("updateAdminProfile allows modifying other fields", async () => {
  resetDatabase();
  const service = new ContentService();

  await service.updateAdminProfile({
    name: "New Name",
    role: "New Role",
    email: "new@email.com",
  });

  const profile = await service.getAdminProfile();
  assert.equal(profile.name, "New Name");
  assert.equal(profile.role, "New Role");
  assert.equal(profile.email, "new@email.com");
});

// ── Security: Environment Validation ────────────────────────────────────────

test("getDataSource throws for production data sources", async () => {
  const { getDataSource } = await import("../lib/config/env");

  const productionValues = ["postgres", "production"];
  for (const value of productionValues) {
    const previous = process.env.DATA_SOURCE;
    process.env.DATA_SOURCE = value;
    assert.throws(
      () => getDataSource(),
      /not allowed/,
      `DATA_SOURCE="${value}" should throw`,
    );
    process.env.DATA_SOURCE = previous;
  }
});

test("getDataSource accepts mock data source", async () => {
  const { getDataSource } = await import("../lib/config/env");

  const previous = process.env.DATA_SOURCE;
  process.env.DATA_SOURCE = "mock";
  const result = getDataSource();
  assert.equal(result, "mock");
  process.env.DATA_SOURCE = previous;
});

test("getDataSource defaults to mock when unset", async () => {
  const { getDataSource } = await import("../lib/config/env");

  const previous = process.env.DATA_SOURCE;
  delete process.env.DATA_SOURCE;
  const result = getDataSource();
  assert.equal(result, "mock");
  process.env.DATA_SOURCE = previous;
});
