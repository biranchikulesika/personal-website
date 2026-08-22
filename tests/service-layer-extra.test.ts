import assert from "node:assert/strict";
import { test } from "node:test";
import { ContentService } from "../lib/services/content.service";
import { InMemoryTestContentRepository } from "./in-memory-test-content-repository";
import {
  createTestNote,
  createTestBook,
  createTestNowEntry,
} from "./fixtures";
import {
  getSupabaseUrl,
  getSupabasePublishableKey,
  getSupabaseSecretKey,
  getSupabaseJwtSecret,
  getPostgresUrl,
} from "../lib/config/env";

// ── Now Entries CRUD ────────────────────────────────────────────────────────

test("content service supports full CRUD on now entries", async () => {
  const repo = new InMemoryTestContentRepository();
  const service = new ContentService(repo);

  const initialEntries = await service.getNowEntries();
  assert.equal(initialEntries.length, 0, "should have no now entries initially");

  // Create
  const newEntry = createTestNowEntry({ id: "now-test-1", title: "Testing Now Entry" });

  await service.saveNowEntry(newEntry);
  const afterCreate = await service.getNowEntries();
  assert.equal(afterCreate.length, 1);

  // Read
  const found = afterCreate.find((e) => e.id === "now-test-1");
  assert.ok(found, "created entry should be findable");
  assert.equal(found.title, "Testing Now Entry");

  // Update
  const updatedEntry = { ...newEntry, title: "Updated Now Entry" };
  await service.saveNowEntry(updatedEntry);
  const afterUpdate = await service.getNowEntries();
  const updatedFound = afterUpdate.find((e) => e.id === "now-test-1");
  assert.equal(updatedFound!.title, "Updated Now Entry");
  assert.equal(afterUpdate.length, 1, "should not duplicate on update");

  // Delete
  const deleted = await service.deleteNowEntry("now-test-1");
  assert.equal(deleted, true);
  const afterDelete = await service.getNowEntries();
  assert.equal(afterDelete.length, 0);

  // Delete non-existent
  const deletedNonExistent = await service.deleteNowEntry("does-not-exist");
  assert.equal(deletedNonExistent, false);
});

// ── Orphaned Media Detection ────────────────────────────────────────────────

test("content service detects orphaned media assets", async () => {
  const repo = new InMemoryTestContentRepository();
  const service = new ContentService(repo);

  const orphaned = await service.getOrphanedMedia();
  assert.ok(orphaned.length >= 1, "should detect orphaned assets in test repo");

  // Orphaned items should have src, name, and id
  for (const item of orphaned) {
    assert.ok(item.src, "orphaned item should have src");
    assert.ok(item.name, "orphaned item should have name");
    assert.ok(item.id, "orphaned item should have id");
  }
});

test("content service deleteStorageAssets removes specified assets", async () => {
  const repo = new InMemoryTestContentRepository();
  const service = new ContentService(repo);

  const orphaned = await service.getOrphanedMedia();
  assert.ok(orphaned.length > 0, "should have orphaned assets");

  const srcsToDelete = orphaned.slice(0, 1).map((m) => m.src);
  const deletedCount = await service.deleteStorageAssets(srcsToDelete);
  assert.equal(deletedCount, 1);

  const remaining = await service.getOrphanedMedia();
  assert.ok(remaining.length < orphaned.length, "should have fewer orphaned assets");
});

// ── Post Status Toggle Edge Cases ───────────────────────────────────────────

test("togglePostStatus returns null for missing post", async () => {
  const repo = new InMemoryTestContentRepository();
  const service = new ContentService(repo);

  const result = await service.togglePostStatus("nonexistent-slug");
  assert.equal(result, null);
});

test("toggleNoteStatus returns null for missing note", async () => {
  const repo = new InMemoryTestContentRepository();
  const service = new ContentService(repo);

  const result = await service.toggleNoteStatus("nonexistent-slug");
  assert.equal(result, null);
});

// ── Delete Non-Existent Records ─────────────────────────────────────────────

test("deletePost returns false for non-existent post", async () => {
  const repo = new InMemoryTestContentRepository();
  const service = new ContentService(repo);

  const result = await service.deletePost("nonexistent-slug");
  assert.equal(result, false);
});

test("deleteNote returns false for non-existent note", async () => {
  const repo = new InMemoryTestContentRepository();
  const service = new ContentService(repo);

  const result = await service.deleteNote("nonexistent-slug");
  assert.equal(result, false);
});

test("deleteBook returns false for non-existent book", async () => {
  const repo = new InMemoryTestContentRepository();
  const service = new ContentService(repo);

  const result = await service.deleteBook("nonexistent-slug");
  assert.equal(result, false);
});

// ── User Roles ────────────────────────────────────────────────────────────

test("setUserRole persists and getUserRole retrieves", async () => {
  const repo = new InMemoryTestContentRepository();
  const service = new ContentService(repo);

  await service.setUserRole("test-user", "content_admin");
  const role = await service.getUserRole("test-user");
  assert.equal(role, "content_admin");
});

test("getUserRole returns null for nonexistent user", async () => {
  const repo = new InMemoryTestContentRepository();
  const service = new ContentService(repo);

  const role = await service.getUserRole("nonexistent");
  assert.equal(role, null);
});

// ── Note CRUD Edge Cases ────────────────────────────────────────────────────

test("saveNote creates new note and updates existing note", async () => {
  const repo = new InMemoryTestContentRepository();
  const service = new ContentService(repo);

  const initialCount = (await service.getAllNotes()).length;

  // Create
  const note = createTestNote({ id: "new-note", slug: "new-note-slug", title: "New Note" });

  await service.saveNote(note);
  const afterCreate = await service.getAllNotes();
  assert.equal(afterCreate.length, initialCount + 1);

  // Update (same slug)
  const updated = createTestNote({ id: "new-note", slug: "new-note-slug", title: "Updated Note" });
  await service.saveNote(updated);
  const afterUpdate = await service.getAllNotes();
  assert.equal(afterUpdate.length, initialCount + 1, "should not duplicate on update");
  assert.equal(afterUpdate.find((n) => n.slug === "new-note-slug")!.title, "Updated Note");
});

// ── Book CRUD Edge Cases ────────────────────────────────────────────────────

test("saveBook creates new book and updates existing book", async () => {
  const repo = new InMemoryTestContentRepository();
  const service = new ContentService(repo);

  const initialCount = (await service.getAllBooks()).length;

  // Create
  const book = createTestBook({ id: "new-book", slug: "new-book-slug", title: "New Book" });

  await service.saveBook(book);
  const afterCreate = await service.getAllBooks();
  assert.equal(afterCreate.length, initialCount + 1);

  // Update (same slug)
  const updated = createTestBook({ id: "new-book", slug: "new-book-slug", title: "Updated Book" });
  await service.saveBook(updated);
  const afterUpdate = await service.getAllBooks();
  assert.equal(afterUpdate.length, initialCount + 1, "should not duplicate on update");
  assert.equal(afterUpdate.find((b) => b.slug === "new-book-slug")!.title, "Updated Book");
});

// ── Supabase & Vercel Environment Variable Resolution ────────────────────────

test("getSupabaseUrl resolves NEXT_PUBLIC_SUPABASE_URL and SUPABASE_URL", () => {
  const origNextUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const origUrl = process.env.SUPABASE_URL;

  try {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_URL;
    assert.equal(getSupabaseUrl(), undefined);

    process.env.SUPABASE_URL = "https://supabase-url.supabase.co";
    assert.equal(getSupabaseUrl(), "https://supabase-url.supabase.co");

    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://next-public-url.supabase.co";
    assert.equal(getSupabaseUrl(), "https://next-public-url.supabase.co");
  } finally {
    if (origNextUrl) process.env.NEXT_PUBLIC_SUPABASE_URL = origNextUrl;
    else delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (origUrl) process.env.SUPABASE_URL = origUrl;
    else delete process.env.SUPABASE_URL;
  }
});

test("getSupabasePublishableKey resolves all 4 public/anon key variants", () => {
  const origPub = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const origAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const origSupPub = process.env.SUPABASE_PUBLISHABLE_KEY;
  const origSupAnon = process.env.SUPABASE_ANON_KEY;

  try {
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_PUBLISHABLE_KEY;
    delete process.env.SUPABASE_ANON_KEY;
    assert.equal(getSupabasePublishableKey(), undefined);

    process.env.SUPABASE_ANON_KEY = "anon-key-1";
    assert.equal(getSupabasePublishableKey(), "anon-key-1");

    process.env.SUPABASE_PUBLISHABLE_KEY = "pub-key-2";
    assert.equal(getSupabasePublishableKey(), "pub-key-2");

    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "next-anon-key-3";
    assert.equal(getSupabasePublishableKey(), "next-anon-key-3");

    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "next-pub-key-4";
    assert.equal(getSupabasePublishableKey(), "next-pub-key-4");
  } finally {
    if (origPub) process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = origPub;
    else delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (origAnon) process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = origAnon;
    else delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (origSupPub) process.env.SUPABASE_PUBLISHABLE_KEY = origSupPub;
    else delete process.env.SUPABASE_PUBLISHABLE_KEY;
    if (origSupAnon) process.env.SUPABASE_ANON_KEY = origSupAnon;
    else delete process.env.SUPABASE_ANON_KEY;
  }
});

test("getSupabaseSecretKey resolves SUPABASE_SERVICE_ROLE_KEY and SUPABASE_SECRET_KEY", () => {
  const origService = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const origSecret = process.env.SUPABASE_SECRET_KEY;

  try {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_SECRET_KEY;
    assert.equal(getSupabaseSecretKey(), undefined);

    process.env.SUPABASE_SECRET_KEY = "secret-key-1";
    assert.equal(getSupabaseSecretKey(), "secret-key-1");

    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key-2";
    assert.equal(getSupabaseSecretKey(), "service-role-key-2");
  } finally {
    if (origService) process.env.SUPABASE_SERVICE_ROLE_KEY = origService;
    else delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (origSecret) process.env.SUPABASE_SECRET_KEY = origSecret;
    else delete process.env.SUPABASE_SECRET_KEY;
  }
});

test("getSupabaseJwtSecret and getPostgresUrl resolve properly", () => {
  const origJwt = process.env.SUPABASE_JWT_SECRET;
  const origPg = process.env.POSTGRES_URL;
  const origPrisma = process.env.POSTGRES_PRISMA_URL;
  const origNonPool = process.env.POSTGRES_URL_NON_POOLING;

  try {
    delete process.env.SUPABASE_JWT_SECRET;
    assert.equal(getSupabaseJwtSecret(), undefined);
    process.env.SUPABASE_JWT_SECRET = "jwt-secret-xyz";
    assert.equal(getSupabaseJwtSecret(), "jwt-secret-xyz");

    delete process.env.POSTGRES_URL;
    delete process.env.POSTGRES_PRISMA_URL;
    delete process.env.POSTGRES_URL_NON_POOLING;
    assert.equal(getPostgresUrl(), undefined);

    process.env.POSTGRES_URL_NON_POOLING = "postgres://non-pooling";
    assert.equal(getPostgresUrl(), "postgres://non-pooling");

    process.env.POSTGRES_PRISMA_URL = "postgres://prisma";
    assert.equal(getPostgresUrl(), "postgres://prisma");

    process.env.POSTGRES_URL = "postgres://standard";
    assert.equal(getPostgresUrl(), "postgres://standard");
  } finally {
    if (origJwt) process.env.SUPABASE_JWT_SECRET = origJwt;
    else delete process.env.SUPABASE_JWT_SECRET;
    if (origPg) process.env.POSTGRES_URL = origPg;
    else delete process.env.POSTGRES_URL;
    if (origPrisma) process.env.POSTGRES_PRISMA_URL = origPrisma;
    else delete process.env.POSTGRES_PRISMA_URL;
    if (origNonPool) process.env.POSTGRES_URL_NON_POOLING = origNonPool;
    else delete process.env.POSTGRES_URL_NON_POOLING;
  }
});
