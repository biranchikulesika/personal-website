import assert from "node:assert/strict";
import { test } from "node:test";
import { getDataSource } from "../lib/config/env";
import { resetDatabase } from "../lib/data/mock-db";
import { ContentService } from "../lib/services/content.service";

test("content service reads site content from the mock database", async () => {
  resetDatabase();
  const service = new ContentService();
  const site = await service.getSiteContent();
  assert.ok(site.identity.name.length > 0, "site should have an identity name");
  assert.ok(site.nav.links.length > 0, "site should have nav links");
  assert.ok(site.hero.headline.length > 0, "site should have a hero headline");
  assert.ok(site.footer.bottom.length > 0, "site should have footer copy");
});

test("content service lists writing items with structured metadata", async () => {
  resetDatabase();
  const service = new ContentService();
  const writing = await service.getWriting();
  assert.ok(
    writing.items.length >= 9,
    "writing should contain all seeded essays",
  );
  assert.ok(
    writing.items.every((item) => item.slug && item.title && item.date),
    "writing items should carry slug, title, and date",
  );
});

test("content service lists library books with metadata", async () => {
  resetDatabase();
  const service = new ContentService();
  const library = await service.getLibrary();
  assert.ok(library.items.length >= 10, "library should contain seeded books");
  assert.ok(
    library.items.every((item) => item.slug && item.title && item.author),
    "book items should carry slug, title, and author",
  );
});

test("content service fetches a full post by slug", async () => {
  resetDatabase();
  const service = new ContentService();
  const post = await service.getPost("building-in-public-carefully");
  assert.ok(post, "featured post should exist");
  assert.ok(post.sections.length > 0, "featured post should have sections");
});

test("content service returns null for a missing post", async () => {
  resetDatabase();
  const service = new ContentService();
  const post = await service.getPost("does-not-exist");
  assert.equal(post, null);
});

test("content service exposes slugs for static generation", async () => {
  resetDatabase();
  const service = new ContentService();
  const slugs = await service.getPostSlugs();
  assert.ok(
    slugs.includes("building-in-public-carefully"),
    "slugs should include the featured post",
  );
});

test("content service aggregates all content types into scribble entries", async () => {
  resetDatabase();
  const service = new ContentService();
  const entries = await service.getScribbleEntries();
  assert.ok(
    entries.length >= 20,
    "scribble should include writing, notes, and books",
  );
  assert.ok(
    entries.every((entry) => entry.title && entry.href),
    "scribble entries should carry title and href",
  );
  const types = new Set(entries.map((entry) => entry.type));
  assert.deepEqual(
    [...types].sort(),
    ["book", "essay", "note"],
    "scribble should cover all content types",
  );
});

test("content service supports full CRUD on posts and notes", async () => {
  resetDatabase();
  const service = new ContentService();

  // 1. Post CRUD
  const initialPosts = await service.getAllPosts();
  const testPost = {
    slug: "testing-crud-post",
    title: "Testing CRUD Post",
    description: "A test essay for admin CRUD",
    tags: ["test", "admin"],
    publishedAt: "2026-08-20",
    lastEditedAt: "2026-08-20",
    assumedAudience: "Testing suite",
    intro: ["Opening intro."],
    sections: [
      { id: "sec-1", heading: "Section 1", paragraphs: ["Body text"] },
    ],
    books: [],
  };

  await service.savePost(testPost, "builder");
  const fetchedPost = await service.getPost("testing-crud-post");
  assert.ok(fetchedPost, "saved post should be retrievable");
  assert.equal(fetchedPost.title, "Testing CRUD Post");

  const updatedPosts = await service.getAllPosts();
  assert.equal(updatedPosts.length, initialPosts.length + 1);

  // Status toggle
  const toggled = await service.togglePostStatus("testing-crud-post");
  assert.ok(toggled);
  assert.equal(toggled.status, "unpublished");

  const toggledBack = await service.togglePostStatus("testing-crud-post");
  assert.ok(toggledBack);
  assert.equal(toggledBack.status, "published");

  const deletedPost = await service.deletePost("testing-crud-post");
  assert.equal(deletedPost, true);
  const afterDelete = await service.getPost("testing-crud-post");
  assert.equal(afterDelete, null);

  // 2. Note CRUD
  const initialNotes = await service.getAllNotes();
  const testNote = {
    id: "test-note-1",
    slug: "testing-note-slug",
    title: "Testing Note",
    description: "Short note description",
    content: ["First paragraph of note."],
    date: "2026-08-20",
    persona: "thinker" as const,
    tags: ["testing"],
  };

  await service.saveNote(testNote);
  const fetchedNote = await service.getNote("testing-note-slug");
  assert.ok(fetchedNote, "saved note should be retrievable");
  assert.equal(fetchedNote.title, "Testing Note");

  const toggledNote = await service.toggleNoteStatus("testing-note-slug");
  assert.ok(toggledNote);
  assert.equal(toggledNote.status, "unpublished");

  const deletedNote = await service.deleteNote("testing-note-slug");
  assert.equal(deletedNote, true);
  const afterDeleteNote = await service.getNote("testing-note-slug");
  assert.equal(afterDeleteNote, null);

  // 3. Book CRUD
  const initialBooks = await service.getAllBooks();
  const testBook = {
    id: "test-book-1",
    slug: "testing-book-slug",
    title: "Testing Book",
    author: "Test Author",
    description: "Book summary",
    date: "2026-08-20",
    persona: "thinker" as const,
    tags: ["reading"],
  };

  await service.saveBook(testBook);
  const updatedBooks = await service.getAllBooks();
  assert.equal(updatedBooks.length, initialBooks.length + 1);

  const deletedBook = await service.deleteBook("testing-book-slug");
  assert.equal(deletedBook, true);
  const afterDeleteBook = await service.getAllBooks();
  assert.equal(afterDeleteBook.length, initialBooks.length);
});

test("content service supports media and admin profile management", async () => {
  resetDatabase();
  const service = new ContentService();

  // Media
  const initialMedia = await service.getMedia();
  assert.ok(initialMedia.length >= 7, "should have seeded media assets");

  const newMedia = {
    id: "media-test-1",
    name: "test-image.jpeg",
    src: "/test-image.jpeg",
    alt: "Test Image",
    size: "120 KB",
    uploadedAt: "2026-08-20",
    tag: "atmosphere" as const,
  };

  await service.addMedia(newMedia);
  const updatedMedia = await service.getMedia();
  assert.equal(updatedMedia.length, initialMedia.length + 1);

  await service.deleteMedia("media-test-1");
  const finalMedia = await service.getMedia();
  assert.equal(finalMedia.length, initialMedia.length);

  // Admin Profile
  const profile = await service.getAdminProfile();
  assert.equal(profile.name, "Biranchi Kulesika");
  assert.equal(profile.authStatus, "developer_mode");

  await service.updateAdminProfile({ role: "Lead Architect" });
  const updatedProfile = await service.getAdminProfile();
  assert.equal(updatedProfile.role, "Lead Architect");
});

test("environment rejects production data sources", () => {
  const previous = process.env.DATA_SOURCE;
  process.env.DATA_SOURCE = "supabase";
  assert.throws(() => getDataSource(), /not allowed/);
  process.env.DATA_SOURCE = previous;
});

test("slug collision is rejected on cross-collection insert", async () => {
  process.env.DATA_SOURCE = 'mock';
  resetDatabase();
  const service = new ContentService();

  // A new post with a slug that already exists as a note should be rejected.
  const noteSlug = (await service.getAllNotes())[0].slug;
  const conflictingPost = {
    slug: noteSlug,
    title: "Conflicting Post",
    description: "Should fail",
    tags: ["test"],
    publishedAt: "2026-08-20",
    lastEditedAt: "2026-08-20",
    assumedAudience: "Tests",
    intro: ["Intro"],
    sections: [],
    books: [],
  };

  await assert.rejects(
    () => service.savePost(conflictingPost, "builder"),
    /already exists/,
    "should reject post slug that conflicts with existing note",
  );

  // Updating an existing post with the same slug should succeed (not a collision).
  const existingPost = await service.getPost("building-in-public-carefully");
  assert.ok(existingPost);
  const updated = await service.savePost(
    { ...existingPost, title: "Updated Title" },
    "builder",
  );
  assert.equal(updated.title, "Updated Title");
});
