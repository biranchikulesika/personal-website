import assert from "node:assert/strict";
import { test } from "node:test";
import { resetDatabase } from "../lib/data/mock-db";
import { ContentService } from "../lib/services/content.service";
import {
  createTestPost,
  createTestNote,
  createTestBook,
  createTestNowEntry,
  createTestMedia,
} from "./fixtures";

// ── Now Entries CRUD ────────────────────────────────────────────────────────

test("content service supports full CRUD on now entries", async () => {
  resetDatabase();
  const service = new ContentService();

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
  resetDatabase();
  const service = new ContentService();

  const orphaned = await service.getOrphanedMedia();
  assert.ok(orphaned.length >= 2, "should detect orphaned assets in seed data");

  // Orphaned items should have src, name, and id
  for (const item of orphaned) {
    assert.ok(item.src, "orphaned item should have src");
    assert.ok(item.name, "orphaned item should have name");
    assert.ok(item.id, "orphaned item should have id");
  }
});

test("content service deleteStorageAssets removes specified assets", async () => {
  resetDatabase();
  const service = new ContentService();

  const orphaned = await service.getOrphanedMedia();
  assert.ok(orphaned.length > 0, "should have orphaned assets");

  const srcsToDelete = orphaned.slice(0, 2).map((m) => m.src);
  const deletedCount = await service.deleteStorageAssets(srcsToDelete);
  assert.equal(deletedCount, 2);

  const remaining = await service.getOrphanedMedia();
  assert.ok(remaining.length < orphaned.length, "should have fewer orphaned assets");
});

// ── Post Status Toggle Edge Cases ───────────────────────────────────────────

test("togglePostStatus returns null for missing post", async () => {
  resetDatabase();
  const service = new ContentService();

  const result = await service.togglePostStatus("nonexistent-slug");
  assert.equal(result, null);
});

test("toggleNoteStatus returns null for missing note", async () => {
  resetDatabase();
  const service = new ContentService();

  const result = await service.toggleNoteStatus("nonexistent-slug");
  assert.equal(result, null);
});

// ── Delete Non-Existent Records ─────────────────────────────────────────────

test("deletePost returns false for non-existent post", async () => {
  resetDatabase();
  const service = new ContentService();

  const result = await service.deletePost("nonexistent-slug");
  assert.equal(result, false);
});

test("deleteNote returns false for non-existent note", async () => {
  resetDatabase();
  const service = new ContentService();

  const result = await service.deleteNote("nonexistent-slug");
  assert.equal(result, false);
});

test("deleteBook returns false for non-existent book", async () => {
  resetDatabase();
  const service = new ContentService();

  const result = await service.deleteBook("nonexistent-slug");
  assert.equal(result, false);
});

// ── User Roles ────────────────────────────────────────────────────────────

test("setUserRole persists and getUserRole retrieves", async () => {
  resetDatabase();
  const service = new ContentService();

  await service.setUserRole("test-user", "content_admin");
  const role = await service.getUserRole("test-user");
  assert.equal(role, "content_admin");
});

test("getUserRole returns null for nonexistent user", async () => {
  resetDatabase();
  const service = new ContentService();

  const role = await service.getUserRole("nonexistent");
  assert.equal(role, null);
});

// ── Note CRUD Edge Cases ────────────────────────────────────────────────────

test("saveNote creates new note and updates existing note", async () => {
  resetDatabase();
  const service = new ContentService();

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
  resetDatabase();
  const service = new ContentService();

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
