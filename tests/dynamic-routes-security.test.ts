import assert from "node:assert/strict";
import { test } from "node:test";
import { resetDatabase } from "../lib/data/mock-db";
import { ContentService } from "../lib/services/content.service";

// ── Dynamic Route: /p/[slug] ────────────────────────────────────────────────

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

  // But should NOT appear in published slugs
  const slugs = await service.getPostSlugs();
  assert.ok(!slugs.includes("unpublished-test-post"), "unpublished post should not appear in published slugs");

  // Cleanup
  await service.deletePost("unpublished-test-post");
});

test("post page returns data for valid published slug", async () => {
  resetDatabase();
  const service = new ContentService();

  // Create a published post
  const testPost = {
    slug: "test-published-post",
    title: "Test Published Post",
    description: "A test post",
    tags: ["test"],
    publishedAt: "2026-08-20",
    lastEditedAt: "2026-08-20",
    assumedAudience: "Test",
    intro: ["Intro paragraph."],
    sections: [{ id: "sec-1", heading: "Section", paragraphs: ["Body"] }],
    books: [],
  };
  await service.savePost(testPost, "builder");

  const post = await service.getPost("test-published-post");
  assert.ok(post, "published post should exist");
  assert.equal(post.title, "Test Published Post");
  assert.ok(post.sections.length > 0, "post should have sections");

  // Cleanup
  await service.deletePost("test-published-post");
});

test("note page returns null for invalid slug", async () => {
  resetDatabase();
  const service = new ContentService();
  const note = await service.getNote("nonexistent-note-xyz");
  assert.equal(note, null, "nonexistent note should return null");
});

// ── Security: User Roles ──────────────────────────────────────────────────

test("getUserRole returns null for unknown user", async () => {
  resetDatabase();
  const service = new ContentService();
  const role = await service.getUserRole("unknown-user-id");
  assert.equal(role, null);
});

test("setUserRole and getUserRole work correctly", async () => {
  resetDatabase();
  const service = new ContentService();

  await service.setUserRole("user-1", "content_admin");
  const role = await service.getUserRole("user-1");
  assert.equal(role, "content_admin");

  // Update role
  await service.setUserRole("user-1", "super_admin");
  const updatedRole = await service.getUserRole("user-1");
  assert.equal(updatedRole, "super_admin");
});

test("getAllUserRoles returns all assigned roles", async () => {
  resetDatabase();
  const service = new ContentService();

  await service.setUserRole("user-1", "user");
  await service.setUserRole("user-2", "content_admin");
  await service.setUserRole("user-3", "super_admin");

  const roles = await service.getAllUserRoles();
  assert.equal(roles.length, 3);
});

// ── Security: Environment Validation ────────────────────────────────────────

test("getDataSource throws for production data sources", async () => {
  const { getDataSource } = await import("../lib/config/env");

  const original = process.env.DATA_SOURCE;
  process.env.DATA_SOURCE = "postgres";
  assert.throws(() => getDataSource(), /not allowed/);
  process.env.DATA_SOURCE = "production";
  assert.throws(() => getDataSource(), /not allowed/);
  process.env.DATA_SOURCE = original ?? "mock";
});

test("getDataSource accepts mock and supabase", async () => {
  const { getDataSource } = await import("../lib/config/env");

  const original = process.env.DATA_SOURCE;
  process.env.DATA_SOURCE = "mock";
  assert.equal(getDataSource(), "mock");
  process.env.DATA_SOURCE = "supabase";
  assert.equal(getDataSource(), "supabase");
  process.env.DATA_SOURCE = original ?? "mock";
});

// ── Proxy Middleware Admin Authentication Guard ────────────────────────────

test("proxy middleware redirects unauthenticated requests on /admin to /admin/login", async () => {
  const { default: proxy } = await import("../proxy");
  const { NextRequest } = await import("next/server");

  const request = new NextRequest("http://localhost:3000/admin");
  const response = await proxy(request);

  assert.equal(response.status, 307);
  const location = response.headers.get("location");
  assert.ok(location?.includes("/admin/login"));
});

test("proxy middleware redirects unauthenticated requests on /admin/compose to /admin/login with next param", async () => {
  const { default: proxy } = await import("../proxy");
  const { NextRequest } = await import("next/server");

  const request = new NextRequest("http://localhost:3000/admin/compose");
  const response = await proxy(request);

  assert.equal(response.status, 307);
  const location = response.headers.get("location");
  assert.ok(location?.includes("/admin/login"));
  assert.ok(location?.includes("next=%2Fadmin%2Fcompose") || location?.includes("next=/admin/compose"));
});

test("proxy middleware allows access to /admin/login and /admin/auth/callback", async () => {
  const { default: proxy } = await import("../proxy");
  const { NextRequest } = await import("next/server");

  const loginReq = new NextRequest("http://localhost:3000/admin/login");
  const loginRes = await proxy(loginReq);
  assert.equal(loginRes.status, 200);

  const callbackReq = new NextRequest("http://localhost:3000/admin/auth/callback");
  const callbackRes = await proxy(callbackReq);
  assert.equal(callbackRes.status, 200);
});

// ── Content Isolation ──────────────────────────────────────────────────────

test("empty database returns empty content collections", async () => {
  resetDatabase();
  const service = new ContentService();

  const posts = await service.getAllPosts();
  assert.equal(posts.length, 0);

  const notes = await service.getAllNotes();
  assert.equal(notes.length, 0);

  const books = await service.getAllBooks();
  assert.equal(books.length, 0);

  const now = await service.getNowEntries();
  assert.equal(now.length, 0);
});

// ── Post CRUD Security ─────────────────────────────────────────────────────

test("savePost creates and retrieves a post", async () => {
  resetDatabase();
  const service = new ContentService();

  const testPost = {
    slug: "security-test-post",
    title: "Security Test",
    description: "Test",
    tags: ["test"],
    publishedAt: "2026-08-20",
    lastEditedAt: "2026-08-20",
    assumedAudience: "Test",
    intro: [],
    sections: [],
    books: [],
  };

  await service.savePost(testPost, "builder");
  const post = await service.getPost("security-test-post");
  assert.ok(post);
  assert.equal(post.title, "Security Test");

  // Cleanup
  await service.deletePost("security-test-post");
});

test("deletePost removes a post", async () => {
  resetDatabase();
  const service = new ContentService();

  const testPost = {
    slug: "delete-test-post",
    title: "Delete Test",
    description: "Test",
    tags: ["test"],
    publishedAt: "2026-08-20",
    lastEditedAt: "2026-08-20",
    assumedAudience: "Test",
    intro: [],
    sections: [],
    books: [],
  };

  await service.savePost(testPost, "builder");
  const deleted = await service.deletePost("delete-test-post");
  assert.equal(deleted, true);

  const post = await service.getPost("delete-test-post");
  assert.equal(post, null);
});

// ── Note CRUD Security ─────────────────────────────────────────────────────

test("saveNote creates and retrieves a note", async () => {
  resetDatabase();
  const service = new ContentService();

  const testNote = {
    id: "security-test-note",
    slug: "security-note-slug",
    title: "Security Note",
    description: "Test note",
    content: ["Content"],
    date: "2026-08-20",
    persona: "thinker" as const,
    tags: ["test"],
  };

  await service.saveNote(testNote);
  const note = await service.getNote("security-note-slug");
  assert.ok(note);
  assert.equal(note.title, "Security Note");

  // Cleanup
  await service.deleteNote("security-note-slug");
});

// ── 404 Not Found Handling ──────────────────────────────────────────────────

test("not-found metadata sets robots to noindex", async () => {
  const { metadata } = await import("../app/not-found");
  assert.equal(metadata.title, "Page Not Found | Biranchi Kulesika");
  assert.equal(
    metadata.description,
    "The page you are looking for does not exist or has been moved."
  );
  assert.deepEqual(metadata.robots, { index: false, follow: false });
});
