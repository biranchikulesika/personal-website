import assert from "node:assert/strict";
import { test } from "node:test";
import { ContentService } from "../lib/services/content.service";
import { InMemoryTestContentRepository } from "./in-memory-test-content-repository";
import { SITE_CONFIG } from "../lib/config/site";

test("site config exposes required navigation, hero, and footer content", () => {
  assert.ok(SITE_CONFIG.identity.name.length > 0, "site should have an identity name");
  assert.ok(SITE_CONFIG.nav.links.length > 0, "site should have nav links");
  assert.ok(SITE_CONFIG.hero.headline.length > 0, "site should have a hero headline");
  assert.ok(SITE_CONFIG.footer.bottom.length > 0, "site should have footer copy");
});

test("content service returns empty writing/library when DB is empty", async () => {
  const repo = new InMemoryTestContentRepository();
  const service = new ContentService(repo);
  const writing = await service.getWriting();
  assert.equal(writing.items.length, 0, "writing should be empty with no DB data");
  const library = await service.getLibrary();
  assert.equal(library.items.length, 0, "library should be empty with no DB data");
});

test("content service returns null for a missing post", async () => {
  const repo = new InMemoryTestContentRepository();
  const service = new ContentService(repo);
  const post = await service.getPost("does-not-exist");
  assert.equal(post, null);
});

test("content service supports full CRUD on posts and notes", async () => {
  const repo = new InMemoryTestContentRepository();
  const service = new ContentService(repo);

  // 1. Post CRUD
  const initialPosts = await service.getAllPosts();
  const testPost = {
    slug: "testing-crud-post",
    title: "Testing CRUD Post",
    description: "A test essay for admin CRUD",
    tags: ["test", "admin"],
    publishedAt: "2026-08-20",
    lastEditedAt: "2026-08-20",
    targetAudience: "Testing suite",
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

  await service.togglePostStatus("testing-crud-post");
  const unpubPost = await service.getPost("testing-crud-post");
  assert.equal(unpubPost?.status, "unpublished");

  await service.deletePost("testing-crud-post");
  const deletedPost = await service.getPost("testing-crud-post");
  assert.equal(deletedPost, null);

  // 2. Note CRUD
  const initialNotes = await service.getAllNotes();
  const testNote = {
    id: "note-crud-1",
    slug: "testing-crud-note",
    title: "Testing CRUD Note",
    description: "A test atomic note",
    content: ["Paragraph 1", "Paragraph 2"],
    date: "2026-08-20",
    persona: "thinker" as const,
    tags: ["test"],
  };

  await service.saveNote(testNote);
  const fetchedNote = await service.getNote("testing-crud-note");
  assert.ok(fetchedNote, "saved note should be retrievable");
  assert.equal(fetchedNote.title, "Testing CRUD Note");

  const updatedNotes = await service.getAllNotes();
  assert.equal(updatedNotes.length, initialNotes.length + 1);

  await service.toggleNoteStatus("testing-crud-note");
  const unpubNote = await service.getNote("testing-crud-note");
  assert.equal(unpubNote?.status, "unpublished");

  await service.deleteNote("testing-crud-note");
  const deletedNote = await service.getNote("testing-crud-note");
  assert.equal(deletedNote, null);

  // 3. Book CRUD
  const initialBooks = await service.getAllBooks();
  const testBook = {
    id: "book-crud-1",
    slug: "testing-crud-book",
    title: "Testing CRUD Book",
    author: "Test Author",
    description: "A test book entry",
    date: "2026",
    persona: "thinker" as const,
    tags: ["testing"],
  };

  await service.saveBook(testBook);
  const updatedBooks = await service.getAllBooks();
  assert.equal(updatedBooks.length, initialBooks.length + 1);

  await service.deleteBook("testing-crud-book");
  const finalBooks = await service.getAllBooks();
  assert.equal(finalBooks.length, initialBooks.length);
});

test("content service supports media and user roles", async () => {
  const repo = new InMemoryTestContentRepository();
  const service = new ContentService(repo);

  // Media
  const initialMedia = await service.getMedia();
  const newMedia = {
    id: "media-test-1",
    name: "test.jpg",
    src: "/test.jpg",
    alt: "Test alt",
    size: "100 KB",
    uploadedAt: "2026-08-20",
    tag: "atmosphere" as const,
    tags: ["atmosphere"],
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

test("featured items can be set and retrieved", async () => {
  const repo = new InMemoryTestContentRepository();
  const service = new ContentService(repo);

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
