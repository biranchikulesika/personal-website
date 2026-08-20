import assert from "node:assert/strict";
import { test } from "node:test";
import { getDataSource } from "../lib/config/env";
import { resetDatabase } from "../lib/data/mock-db";
import { ContentService } from "../lib/services/content.service";

test("content service reads hardcoded site config", async () => {
  const service = new ContentService();
  const site = service.getSiteContent();
  assert.ok(site.identity.name.length > 0, "site should have an identity name");
  assert.ok(site.nav.links.length > 0, "site should have nav links");
  assert.ok(site.hero.headline.length > 0, "site should have a hero headline");
  assert.ok(site.footer.bottom.length > 0, "site should have footer copy");
});

test("content service returns empty writing/library when DB is empty", async () => {
  resetDatabase();
  const service = new ContentService();
  const writing = await service.getWriting();
  assert.equal(writing.items.length, 0, "writing should be empty with no DB data");
  const library = await service.getLibrary();
  assert.equal(library.items.length, 0, "library should be empty with no DB data");
});

test("content service returns null for a missing post", async () => {
  resetDatabase();
  const service = new ContentService();
  const post = await service.getPost("does-not-exist");
  assert.equal(post, null);
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

test("content service supports media and user roles", async () => {
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

  // User Roles
  await service.setUserRole("test-user-1", "content_admin");
  const role1 = await service.getUserRole("test-user-1");
  assert.equal(role1, "content_admin");

  await service.setUserRole("test-user-1", "super_admin");
  const role2 = await service.getUserRole("test-user-1");
  assert.equal(role2, "super_admin");

  const noRole = await service.getUserRole("nonexistent-user");
  assert.equal(noRole, null);
});

test("environment rejects production data sources", () => {
  const previous = process.env.DATA_SOURCE;
  process.env.DATA_SOURCE = "postgres";
  assert.throws(() => getDataSource(), /not allowed/);
  process.env.DATA_SOURCE = previous;
});

test("featured items can be set and retrieved", async () => {
  resetDatabase();
  const service = new ContentService();

  // Initially empty
  const initialPosts = await service.getFeaturedPosts();
  assert.equal(initialPosts.length, 0);

  const initialBooks = await service.getFeaturedBooks();
  assert.equal(initialBooks.length, 0);

  // Set featured posts
  await service.setFeaturedPosts(["post-1", "post-2"]);
  const featuredPosts = await service.getFeaturedPosts();
  assert.equal(featuredPosts.length, 2);
  assert.deepEqual(featuredPosts, ["post-1", "post-2"]);

  // Set featured books
  await service.setFeaturedBooks(["book-1", "book-2", "book-3"]);
  const featuredBooks = await service.getFeaturedBooks();
  assert.equal(featuredBooks.length, 3);

  // Overwrite featured posts
  await service.setFeaturedPosts(["post-3"]);
  const updatedPosts = await service.getFeaturedPosts();
  assert.equal(updatedPosts.length, 1);
  assert.deepEqual(updatedPosts, ["post-3"]);
});
