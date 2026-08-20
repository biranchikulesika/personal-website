import assert from "node:assert/strict";
import { test } from "node:test";
import { rootMetadata, postMetadata, noteMetadata, websiteJsonLd, articleJsonLd } from "../lib/seo";
import type { BlogPost, NoteItem } from "../lib/types";

// ── rootMetadata ────────────────────────────────────────────────────────────

test("rootMetadata has metadataBase pointing to production domain", () => {
  assert.ok(rootMetadata.metadataBase);
  const base = rootMetadata.metadataBase as URL;
  assert.equal(base.origin, "https://biranchikulesika.com");
});

test("rootMetadata has title template with site name", () => {
  const template = rootMetadata.title as { template: string };
  assert.ok(template.template.includes("Biranchi Kulesika"));
});

test("rootMetadata has Open Graph defaults", () => {
  const og = rootMetadata.openGraph as Record<string, unknown>;
  assert.equal(og.type, "website");
  assert.equal(og.locale, "en_US");
  assert.equal(og.siteName, "Biranchi Kulesika");
  assert.ok(og.images);
});

test("rootMetadata has Twitter card defaults", () => {
  const twitter = rootMetadata.twitter as Record<string, unknown>;
  assert.equal(twitter.card, "summary_large_image");
  assert.equal(twitter.creator, "@BKulesika");
});

test("rootMetadata allows indexing by default", () => {
  const robots = rootMetadata.robots as Record<string, unknown>;
  assert.equal(robots.index, true);
  assert.equal(robots.follow, true);
});

// ── postMetadata ────────────────────────────────────────────────────────────

test("postMetadata generates correct metadata for a blog post", () => {
  const post: BlogPost = {
    slug: "test-post",
    title: "Test Post Title",
    description: "A test description",
    tags: ["craft", "tools"],
    publishedAt: "2026-03-03",
    lastEditedAt: "2026-08-21",
    assumedAudience: "Developers",
    intro: ["Intro"],
    sections: [],
    books: [],
    persona: "builder",
  };

  const metadata = postMetadata(post);

  assert.equal(metadata.title, "Test Post Title");
  assert.equal(metadata.description, "A test description");
  const canonical = metadata.alternates!.canonical as string;
  assert.ok(canonical.includes("/p/test-post"));

  const og = metadata.openGraph as Record<string, unknown>;
  assert.equal(og.type, "article");
  assert.equal(og.publishedTime, "2026-03-03");
  assert.equal(og.modifiedTime, "2026-08-21");
  assert.ok((og.tags as string[]).includes("craft"));
  assert.ok((og.tags as string[]).includes("Builder"));
});

test("postMetadata includes twitter:creator", () => {
  const post: BlogPost = {
    slug: "test",
    title: "Test",
    description: "Desc",
    tags: [],
    publishedAt: "2026-08-20",
    lastEditedAt: "2026-08-20",
    assumedAudience: "Test",
    intro: [],
    sections: [],
    books: [],
  };

  const metadata = postMetadata(post);
  const twitter = metadata.twitter as Record<string, unknown>;
  assert.equal(twitter.creator, "@BKulesika");
});

test("postMetadata uses coverImage when available", () => {
  const post: BlogPost = {
    slug: "test",
    title: "Test",
    description: "Desc",
    tags: [],
    publishedAt: "2026-08-20",
    lastEditedAt: "2026-08-20",
    assumedAudience: "Test",
    intro: [],
    sections: [],
    books: [],
    coverImage: "/custom-og.png",
  };

  const metadata = postMetadata(post);
  const og = metadata.openGraph as Record<string, unknown>;
  const images = og.images as Array<{ url: string }>;
  assert.equal(images[0].url, "/custom-og.png");
});

// ── noteMetadata ────────────────────────────────────────────────────────────

test("noteMetadata generates correct metadata for a note", () => {
  const note: NoteItem = {
    id: "note-1",
    slug: "test-note",
    title: "Test Note",
    description: "A note description",
    content: ["Body"],
    date: "2026-08-20",
    persona: "thinker",
    tags: ["philosophy"],
  };

  const metadata = noteMetadata(note);

  assert.equal(metadata.title, "Test Note");
  assert.equal(metadata.description, "A note description");
  const canonical = metadata.alternates!.canonical as string;
  assert.ok(canonical.includes("/n/test-note"));

  const og = metadata.openGraph as Record<string, unknown>;
  assert.equal(og.type, "article");
  assert.ok((og.tags as string[]).includes("philosophy"));
  assert.ok((og.tags as string[]).includes("Thinker"));
});

// ── websiteJsonLd ───────────────────────────────────────────────────────────

test("websiteJsonLd returns valid Person + WebSite schema", () => {
  const jsonLd = websiteJsonLd();

  assert.equal(jsonLd["@type"], "WebSite");
  assert.equal(jsonLd.name, "Biranchi Kulesika");
  assert.equal(jsonLd.url, "https://biranchikulesika.com");
  assert.equal(jsonLd.author["@type"], "Person");
  assert.equal(jsonLd.author.name, "Biranchi Kulesika");
});

// ── articleJsonLd ───────────────────────────────────────────────────────────

test("articleJsonLd returns valid Article schema", () => {
  const post: BlogPost = {
    slug: "test-article",
    title: "Test Article",
    description: "Article description",
    tags: ["craft"],
    publishedAt: "2026-03-03",
    lastEditedAt: "2026-08-21",
    assumedAudience: "Test",
    intro: [],
    sections: [],
    books: [],
  };

  const jsonLd = articleJsonLd(post);

  assert.equal(jsonLd["@type"], "Article");
  assert.equal(jsonLd.headline, "Test Article");
  assert.equal(jsonLd.datePublished, "2026-03-03");
  assert.equal(jsonLd.dateModified, "2026-08-21");
  assert.equal(jsonLd.url, "https://biranchikulesika.com/p/test-article");
  assert.equal(jsonLd.keywords, "craft");
  assert.equal(jsonLd.inLanguage, "en");
});
