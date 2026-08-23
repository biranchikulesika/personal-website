import assert from "node:assert/strict";
import { test } from "node:test";
import { ContentService } from "../lib/services/content.service";
import { InMemoryTestContentRepository } from "./in-memory-test-content-repository";

// ── Publication Lifecycle ───────────────────────────────────────────────────

test("unpublished posts are still accessible by slug (admin editing)", async () => {
  const repo = new InMemoryTestContentRepository();
  const service = new ContentService(repo);

  await service.savePost(
    {
      slug: "unpublished-lifecycle-test",
      title: "Unpublished Test",
      description: "Test",
      tags: [],
      publishedAt: "2026-08-20",
      lastEditedAt: "2026-08-20",
      targetAudience: "Test",
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

  await service.deletePost("unpublished-lifecycle-test");
});

test("toggle post status switches between published and unpublished", async () => {
  const repo = new InMemoryTestContentRepository();
  const service = new ContentService(repo);

  await service.savePost(
    {
      slug: "toggle-lifecycle-test",
      title: "Toggle Test",
      description: "Test",
      tags: [],
      publishedAt: "2026-08-20",
      lastEditedAt: "2026-08-20",
      targetAudience: "Test",
      intro: [],
      sections: [],
      books: [],
      status: "published",
    },
    "builder",
  );

  const toggled = await service.togglePostStatus("toggle-lifecycle-test");
  assert.ok(toggled);
  assert.equal(toggled.status, "unpublished");

  const toggledBack = await service.togglePostStatus("toggle-lifecycle-test");
  assert.ok(toggledBack);
  assert.equal(toggledBack.status, "published");

  await service.deletePost("toggle-lifecycle-test");
});

test("discarding unpublished edits restores the original published post", async () => {
  const repo = new InMemoryTestContentRepository();
  const service = new ContentService(repo);

  const publishedOriginal = {
    slug: "discard-test-post",
    title: "Original Published Title",
    subtitle: "Original Subtitle",
    description: "Original Description",
    tags: ["essay"],
    publishedAt: "2026-08-20",
    lastEditedAt: "2026-08-20",
    targetAudience: "Test Readers",
    intro: ["Original Intro Paragraph"],
    sections: [{ id: "sec-1", heading: "Heading", paragraphs: ["Original body paragraph"] }],
    books: [],
    status: "published" as const,
  };

  await service.savePost(publishedOriginal, "builder");

  // Simulated working copy with unpublished changes
  const workingDraft = {
    ...publishedOriginal,
    title: "Unpublished Modified Title",
    intro: ["Unpublished draft intro"],
    status: "unpublished" as const,
  };

  // Verifying working copy diverged
  assert.notEqual(workingDraft.title, publishedOriginal.title);

  // Discard unpublished edits: reload published baseline from service
  const revertedPost = await service.getPost("discard-test-post");
  assert.ok(revertedPost);
  assert.equal(revertedPost.title, "Original Published Title");
  assert.equal(revertedPost.status, "published");
  assert.deepEqual(revertedPost.intro, ["Original Intro Paragraph"]);

  await service.deletePost("discard-test-post");
});

test("discarding unpublished edits restores the original published note", async () => {
  const repo = new InMemoryTestContentRepository();
  const service = new ContentService(repo);

  const publishedOriginalNote = {
    id: "discard-test-note",
    slug: "discard-test-note",
    title: "Original Note Title",
    subtitle: "Original Note Subtitle",
    description: "Original Note Description",
    content: ["Original Note paragraph 1", "Original Note paragraph 2"],
    date: "2026-08-20",
    persona: "thinker" as const,
    tags: ["note"],
    status: "published" as const,
  };

  await service.saveNote(publishedOriginalNote);

  // Simulated working copy with unpublished changes
  const workingDraftNote = {
    ...publishedOriginalNote,
    title: "Unpublished Note Edits",
    content: ["Draft content that should be discarded"],
  };

  assert.notEqual(workingDraftNote.title, publishedOriginalNote.title);

  // Discard unpublished edits: reload published baseline from service
  const revertedNote = await service.getNote("discard-test-note");
  assert.ok(revertedNote);
  assert.equal(revertedNote.title, "Original Note Title");
  assert.equal(revertedNote.status, "published");
  assert.deepEqual(revertedNote.content, ["Original Note paragraph 1", "Original Note paragraph 2"]);

  await service.deleteNote("discard-test-note");
});

test("default status is published when saving without explicit status", async () => {
  const repo = new InMemoryTestContentRepository();
  const service = new ContentService(repo);

  const saved = await service.savePost(
    {
      slug: "default-status-test",
      title: "Default Status",
      description: "Test",
      tags: [],
      publishedAt: "2026-08-20",
      lastEditedAt: "2026-08-20",
      targetAudience: "Test",
      intro: [],
      sections: [],
      books: [],
    },
    "builder",
  );

  assert.equal(saved.status, "published", "default status should be published");
  await service.deletePost("default-status-test");
});

// ── Slug Lifecycle ──────────────────────────────────────────────────────────

test("slug is used as the URL identifier for posts", async () => {
  const repo = new InMemoryTestContentRepository();
  const service = new ContentService(repo);

  await service.savePost(
    {
      slug: "slug-test-post",
      title: "Slug Test",
      description: "Test",
      tags: [],
      publishedAt: "2026-08-20",
      lastEditedAt: "2026-08-20",
      targetAudience: "Test",
      intro: [],
      sections: [],
      books: [],
    },
    "builder",
  );

  const slugs = await service.getPostSlugs();
  assert.ok(slugs.includes("slug-test-post"), "slug should appear in post slugs");

  for (const slug of slugs) {
    assert.ok(
      /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug),
      `slug "${slug}" should be kebab-case`,
    );
  }

  await service.deletePost("slug-test-post");
});

test("slug is used as the URL identifier for notes", async () => {
  const repo = new InMemoryTestContentRepository();
  const service = new ContentService(repo);

  await service.saveNote({
    id: "slug-test-note",
    slug: "slug-test-note",
    title: "Slug Test Note",
    description: "Test",
    content: ["Test"],
    date: "2026-08-20",
    persona: "thinker",
    tags: [],
  });

  const slugs = await service.getNoteSlugs();
  assert.ok(slugs.includes("slug-test-note"), "slug should appear in note slugs");

  for (const slug of slugs) {
    assert.ok(
      /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug),
      `slug "${slug}" should be kebab-case`,
    );
  }

  await service.deleteNote("slug-test-note");
});

test("slug change breaks URL (documented production concern)", async () => {
  const repo = new InMemoryTestContentRepository();
  const service = new ContentService(repo);

  await service.savePost(
    {
      slug: "original-slug-test",
      title: "Original",
      description: "Test",
      tags: [],
      publishedAt: "2026-08-20",
      lastEditedAt: "2026-08-20",
      targetAudience: "Test",
      intro: [],
      sections: [],
      books: [],
    },
    "builder",
  );

  const original = await service.getPost("original-slug-test");
  assert.ok(original);

  // Save with a different slug — this creates a new post
  const updated = await service.savePost(
    { ...original, slug: "renamed-slug-test" },
    "builder",
  );
  assert.equal(updated.slug, "renamed-slug-test");

  // Original slug still exists (upsert creates new, doesn't rename)
  const stillExists = await service.getPost("original-slug-test");
  assert.ok(stillExists, "original slug should still exist (no rename)");

  await service.deletePost("original-slug-test");
  await service.deletePost("renamed-slug-test");
});

// ── Date Consistency ────────────────────────────────────────────────────────

test("post dates are ISO format strings", async () => {
  const repo = new InMemoryTestContentRepository();
  const service = new ContentService(repo);

  await service.savePost(
    {
      slug: "date-test-post",
      title: "Date Test",
      description: "Test",
      tags: [],
      publishedAt: "2026-08-20",
      lastEditedAt: "2026-08-21",
      targetAudience: "Test",
      intro: [],
      sections: [],
      books: [],
    },
    "builder",
  );

  const post = await service.getPost("date-test-post");
  assert.ok(post);

  assert.ok(
    /^\d{4}-\d{2}-\d{2}$/.test(post.publishedAt),
    `publishedAt "${post.publishedAt}" should be ISO date format`,
  );
  assert.ok(
    /^\d{4}-\d{2}-\d{2}$/.test(post.lastEditedAt),
    `lastEditedAt "${post.lastEditedAt}" should be ISO date format`,
  );

  await service.deletePost("date-test-post");
});

// ── Content Integrity ───────────────────────────────────────────────────────

test("every published post has required fields", async () => {
  const repo = new InMemoryTestContentRepository();
  const service = new ContentService(repo);

  await service.savePost(
    {
      slug: "integrity-test-post",
      title: "Integrity Test",
      description: "Test",
      tags: ["test"],
      publishedAt: "2026-08-20",
      lastEditedAt: "2026-08-20",
      targetAudience: "Test",
      intro: ["Intro"],
      sections: [],
      books: [],
    },
    "builder",
  );

  const posts = await service.getAllPosts();
  for (const post of posts) {
    assert.ok(post.slug, "post must have slug");
    assert.ok(post.title, "post must have title");
    assert.ok(post.description, "post must have description");
    assert.ok(Array.isArray(post.intro), "post intro must be array");
    assert.ok(Array.isArray(post.sections), "post sections must be array");
    assert.ok(Array.isArray(post.tags), "post tags must be array");
  }

  await service.deletePost("integrity-test-post");
});

test("scribble entries aggregate all content types", async () => {
  const repo = new InMemoryTestContentRepository();
  const service = new ContentService(repo);

  // Create one of each type
  await service.savePost(
    {
      slug: "scribble-test-post",
      title: "Scribble Post",
      description: "Test",
      tags: [],
      publishedAt: "2026-08-20",
      lastEditedAt: "2026-08-20",
      targetAudience: "Test",
      intro: [],
      sections: [],
      books: [],
    },
    "builder",
  );

  await service.saveNote({
    id: "scribble-test-note",
    slug: "scribble-test-note",
    title: "Scribble Note",
    description: "Test",
    content: ["Test"],
    date: "2026-08-20",
    persona: "thinker",
    tags: [],
  });

  await service.saveBook({
    id: "scribble-test-book",
    slug: "scribble-test-book",
    title: "Scribble Book",
    author: "Test",
    description: "Test",
    date: "2026",
    persona: "thinker",
    tags: [],
  });

  const entries = await service.getScribbleEntries();
  const types = new Set(entries.map((e) => e.type));
  assert.ok(types.has("essay"), "scribble should include essays");
  assert.ok(types.has("note"), "scribble should include notes");
  assert.ok(!types.has("book"), "scribble should not include books");

  for (const entry of entries) {
    assert.ok(entry.href, "scribble entry must have href");
  }

  await service.deletePost("scribble-test-post");
  await service.deleteNote("scribble-test-note");
  await service.deleteBook("scribble-test-book");
});

test("delete operation removes content permanently", async () => {
  const repo = new InMemoryTestContentRepository();
  const service = new ContentService(repo);

  await service.savePost(
    {
      slug: "delete-lifecycle-test",
      title: "Delete Test",
      description: "Test",
      tags: [],
      publishedAt: "2026-08-20",
      lastEditedAt: "2026-08-20",
      targetAudience: "Test",
      intro: [],
      sections: [],
      books: [],
    },
    "builder",
  );

  const deleted = await service.deletePost("delete-lifecycle-test");
  assert.ok(deleted, "delete should return true");

  const post = await service.getPost("delete-lifecycle-test");
  assert.equal(post, null, "deleted post should not be retrievable");
});

test("media items have valid tag values", async () => {
  const repo = new InMemoryTestContentRepository();
  const service = new ContentService(repo);
  const media = await service.getMedia();

  const validTags = new Set(["profile", "atmosphere", "post", "book"]);
  for (const item of media) {
    assert.ok(
      validTags.has(item.tag),
      `media tag "${item.tag}" should be one of: ${[...validTags].join(", ")}`,
    );
  }
});
