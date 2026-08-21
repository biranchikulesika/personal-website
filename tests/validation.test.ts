import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BlogPostSchema,
  NoteItemSchema,
  BookItemSchema,
  NowEntrySchema,
  MediaItemSchema,
  SlugParamSchema,
  IdParamSchema,
} from "../lib/validation";

// ── BlogPostSchema ──────────────────────────────────────────────────────────

test("BlogPostSchema accepts valid post data", () => {
  const validPost = {
    slug: "my-test-post",
    title: "My Test Post",
    description: "A test post description",
    tags: ["test"],
    publishedAt: "2026-08-20",
    lastEditedAt: "2026-08-20",
    assumedAudience: "Developers",
    intro: ["Intro paragraph"],
    sections: [
      { id: "sec-1", heading: "Section", paragraphs: ["Body"] },
    ],
    books: [],
  };

  const result = BlogPostSchema.safeParse(validPost);
  assert.ok(result.success, "valid post should pass validation");
});

test("BlogPostSchema rejects empty title", () => {
  const invalid = {
    slug: "test",
    title: "",
    description: "desc",
    tags: [],
    publishedAt: "2026-08-20",
    lastEditedAt: "2026-08-20",
    assumedAudience: "Test",
    intro: [],
    sections: [],
    books: [],
  };

  const result = BlogPostSchema.safeParse(invalid);
  assert.ok(!result.success, "empty title should fail validation");
});

test("BlogPostSchema rejects invalid slug format", () => {
  const invalid = {
    slug: "Invalid Slug With Spaces!",
    title: "Test",
    description: "desc",
    tags: [],
    publishedAt: "2026-08-20",
    lastEditedAt: "2026-08-20",
    assumedAudience: "Test",
    intro: [],
    sections: [],
    books: [],
  };

  const result = BlogPostSchema.safeParse(invalid);
  assert.ok(!result.success, "slug with spaces should fail validation");
});

test("BlogPostSchema accepts valid persona values", () => {
  for (const persona of ["builder", "operator", "thinker", "wanderer"]) {
    const post = {
      slug: "test",
      title: "Test",
      description: "desc",
      persona,
      tags: [],
      publishedAt: "2026-08-20",
      lastEditedAt: "2026-08-20",
      assumedAudience: "Test",
      intro: [],
      sections: [],
      books: [],
    };
    const result = BlogPostSchema.safeParse(post);
    assert.ok(result.success, `persona "${persona}" should be valid`);
  }
});

// ── NoteItemSchema ──────────────────────────────────────────────────────────

test("NoteItemSchema accepts valid note data", () => {
  const validNote = {
    id: "note-1",
    slug: "my-test-note",
    title: "My Test Note",
    description: "A test note",
    content: ["First paragraph"],
    date: "2026-08-20",
    persona: "thinker" as const,
    tags: ["test"],
  };

  const result = NoteItemSchema.safeParse(validNote);
  assert.ok(result.success, "valid note should pass validation");

  const noteWithSubtitle = {
    ...validNote,
    subtitle: "A thoughtful subtitle",
  };
  const resultWithSubtitle = NoteItemSchema.safeParse(noteWithSubtitle);
  assert.ok(resultWithSubtitle.success, "note with subtitle should pass validation");
});

test("NoteItemSchema rejects invalid persona", () => {
  const invalid = {
    id: "note-1",
    slug: "test",
    title: "Test",
    description: "desc",
    content: ["Body"],
    date: "2026-08-20",
    persona: "invalid-persona",
    tags: [],
  };

  const result = NoteItemSchema.safeParse(invalid);
  assert.ok(!result.success, "invalid persona should fail validation");
});

// ── BookItemSchema ──────────────────────────────────────────────────────────

test("BookItemSchema accepts valid book data", () => {
  const validBook = {
    id: "book-1",
    slug: "my-test-book",
    title: "My Test Book",
    author: "Test Author",
    description: "Book description",
    date: "2026",
    persona: "thinker" as const,
    tags: ["reading"],
  };

  const result = BookItemSchema.safeParse(validBook);
  assert.ok(result.success, "valid book should pass validation");
});

test("BookItemSchema rejects empty author", () => {
  const invalid = {
    id: "book-1",
    slug: "test",
    title: "Test",
    author: "",
    description: "desc",
    date: "2026",
    persona: "thinker" as const,
    tags: [],
  };

  const result = BookItemSchema.safeParse(invalid);
  assert.ok(!result.success, "empty author should fail validation");
});

// ── NowEntrySchema ──────────────────────────────────────────────────────────

test("NowEntrySchema accepts valid entry", () => {
  const valid = {
    id: "now-1",
    title: "Building a CMS",
    date: "2026-08",
    content: "Currently focused on the editorial system.",
  };

  const result = NowEntrySchema.safeParse(valid);
  assert.ok(result.success, "valid now entry should pass");
});

// ── MediaItemSchema ─────────────────────────────────────────────────────────

test("MediaItemSchema accepts valid media", () => {
  const valid = {
    id: "media-1",
    name: "photo.jpg",
    src: "/photo.jpg",
    alt: "A photo",
    size: "200 KB",
    uploadedAt: "2026-08-20",
    tag: "atmosphere" as const,
  };

  const result = MediaItemSchema.safeParse(valid);
  assert.ok(result.success, "valid media should pass");
});

test("MediaItemSchema accepts valid image data URL", () => {
  const validDataUrl = {
    id: "media-2",
    name: "upload.png",
    src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    alt: "Uploaded PNG",
    size: "120 KB",
    uploadedAt: "2026-08-22",
    tag: "post" as const,
  };

  const result = MediaItemSchema.safeParse(validDataUrl);
  assert.ok(result.success, "valid data URL media should pass");
});

test("MediaItemSchema rejects invalid tag", () => {
  const invalid = {
    id: "media-1",
    name: "photo.jpg",
    src: "/photo.jpg",
    alt: "A photo",
    size: "200 KB",
    uploadedAt: "2026-08-20",
    tag: "invalid-tag",
  };

  const result = MediaItemSchema.safeParse(invalid);
  assert.ok(!result.success, "invalid tag should fail");
});

// ── SlugParamSchema ─────────────────────────────────────────────────────────

test("SlugParamSchema accepts valid slug", () => {
  const result = SlugParamSchema.safeParse({ slug: "valid-slug" });
  assert.ok(result.success);
});

test("SlugParamSchema rejects empty slug", () => {
  const result = SlugParamSchema.safeParse({ slug: "" });
  assert.ok(!result.success);
});

// ── IdParamSchema ───────────────────────────────────────────────────────────

test("IdParamSchema accepts valid id", () => {
  const result = IdParamSchema.safeParse({ id: "some-id" });
  assert.ok(result.success);
});

test("IdParamSchema rejects empty id", () => {
  const result = IdParamSchema.safeParse({ id: "" });
  assert.ok(!result.success);
});
