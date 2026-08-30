import assert from "node:assert/strict";
import { test } from "node:test";
import {
  rootMetadata,
  postMetadata,
  noteMetadata,
  aboutMetadata,
  libraryMetadata,
  scribbleMetadata,
  nowMetadata,
  homeMetadata,
  supportMetadata,
  websiteJsonLd,
  articleJsonLd,
  noteJsonLd,
  breadcrumbJsonLd,
  safeJsonLd,
} from "../lib/seo";
import { SITE_URL } from "../lib/constants";
import type { BlogPost, NoteItem } from "../lib/types";

// ── rootMetadata ────────────────────────────────────────────────────────────

test("rootMetadata has metadataBase pointing to production domain", () => {
  assert.ok(rootMetadata.metadataBase);
  const base = rootMetadata.metadataBase as URL;
  assert.equal(base.origin, SITE_URL);
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

test("rootMetadata has favicon icons and manifest configured", () => {
  assert.ok(rootMetadata.icons, "rootMetadata should define icons");
  const icons = rootMetadata.icons as Record<string, unknown>;
  assert.ok(icons.icon, "icons should have icon entry");
  assert.ok(icons.apple, "icons should have apple entry");
  assert.equal(rootMetadata.manifest, "/manifest.webmanifest");
});

test("manifest function returns valid web app manifest", async () => {
  const { default: manifest } = await import("../app/manifest");
  const data = manifest();
  assert.equal(data.name, "Biranchi Kulesika");
  assert.equal(data.short_name, "Biranchi");
  assert.equal(data.background_color, "#141413");
  assert.equal(data.theme_color, "#141413");
  assert.equal(data.display, "standalone");
  assert.ok(data.icons && data.icons.length > 0, "manifest should have icons");
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
    targetAudience: "Developers",
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
    targetAudience: "Test",
    intro: [],
    sections: [],
    books: [],
  };

  const metadata = postMetadata(post);
  const twitter = metadata.twitter as Record<string, unknown>;
  assert.equal(twitter.creator, "@BKulesika");
});

test("postMetadata uses dedicated per-slug OG route", () => {
  const post: BlogPost = {
    slug: "test",
    title: "Test",
    description: "Desc",
    tags: [],
    publishedAt: "2026-08-20",
    lastEditedAt: "2026-08-20",
    targetAudience: "Test",
    intro: [],
    sections: [],
    books: [],
    coverImage: "/custom-og.png",
  };

  const metadata = postMetadata(post);
  const og = metadata.openGraph as Record<string, unknown>;
  const images = og.images as Array<{ url: string }>;
  assert.ok(
    images[0].url.includes("/api/og?slug=test"),
    "OG image should use the dynamic endpoint with slug param",
  );
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
  const images = og.images as Array<{ url: string }>;
  assert.ok(images[0].url.includes("/api/og?slug=test-note&type=note"));

  const noteWithSubtitle: NoteItem = {
    ...note,
    subtitle: "Custom Note Subtitle",
  };
  const metaWithSubtitle = noteMetadata(noteWithSubtitle);
  assert.equal(metaWithSubtitle.description, "Custom Note Subtitle");
});

// ── websiteJsonLd ───────────────────────────────────────────────────────────

test("websiteJsonLd returns valid Person + WebSite schema", () => {
  const jsonLd = websiteJsonLd();

  assert.equal(jsonLd["@type"], "WebSite");
  assert.equal(jsonLd.name, "Biranchi Kulesika");
  assert.equal(jsonLd.url, SITE_URL);
  assert.equal(jsonLd.author["@type"], "Person");
  assert.equal(jsonLd.author.name, "Biranchi Kulesika");
  assert.ok(jsonLd.author.sameAs.length > 0);
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
    targetAudience: "Test",
    intro: [],
    sections: [],
    books: [],
  };

  const jsonLd = articleJsonLd(post);

  assert.equal(jsonLd["@type"], "Article");
  assert.equal(jsonLd.headline, "Test Article");
  assert.equal(jsonLd.datePublished, "2026-03-03");
  assert.equal(jsonLd.dateModified, "2026-08-21");
  assert.equal(jsonLd.url, `${SITE_URL}/p/test-article`);
  assert.equal(jsonLd.keywords, "craft");
  assert.ok(jsonLd.image.startsWith("http"), "Article image must be an absolute URL");
  assert.ok(jsonLd.inLanguage.startsWith("en"));
});

// ── noteJsonLd & breadcrumbJsonLd ───────────────────────────────────────────

test("noteJsonLd returns valid Article/Document schema for atomic note", () => {
  const note: NoteItem = {
    id: "note-1",
    slug: "note-on-clarity",
    title: "Note on Clarity",
    description: "A short note on thinking clearly",
    content: ["Writing is thinking."],
    date: "2026-08-21",
    persona: "thinker",
    tags: ["clarity", "writing"],
  };

  const jsonLd = noteJsonLd(note);

  assert.equal(jsonLd["@type"], "Article");
  assert.equal(jsonLd.headline, "Note on Clarity");
  assert.equal(jsonLd.datePublished, "2026-08-21");
  assert.equal(jsonLd.url, `${SITE_URL}/n/note-on-clarity`);
  assert.ok(jsonLd.image.startsWith("http"), "Note image must be an absolute URL");
});

test("breadcrumbJsonLd generates valid BreadcrumbList schema", () => {
  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", url: "/" },
    { name: "Scribble", url: "/scribble" },
    { name: "My Article", url: "/p/my-article" },
  ]);

  assert.equal(breadcrumbs["@type"], "BreadcrumbList");
  assert.equal(breadcrumbs.itemListElement.length, 3);
  assert.equal(breadcrumbs.itemListElement[0].name, "Home");
  assert.equal(breadcrumbs.itemListElement[1].name, "Scribble");
  assert.equal(breadcrumbs.itemListElement[2].name, "My Article");
  assert.equal(breadcrumbs.itemListElement[2].position, 3);
});

test("safeJsonLd escapes < to prevent </script> tag injection breakout", () => {
  const maliciousObject = {
    title: "</script><script>alert('xss')</script>",
  };
  const serialized = safeJsonLd(maliciousObject);
  assert.equal(serialized.includes("<"), false, "JSON-LD string must not contain raw < characters");
  assert.ok(serialized.includes(String.raw`\u003c/script>`));
});

// ── Section metadata builders ───────────────────────────────────────────────

test("aboutMetadata generates correct metadata pointing to dynamic OG route", () => {
  const meta = aboutMetadata();
  assert.equal(meta.title, "About");
  assert.equal(meta.alternates?.canonical, `${SITE_URL}/about`);
  const og = meta.openGraph as Record<string, unknown>;
  const images = og.images as Array<{ url: string }>;
  assert.ok(images[0].url.includes("/api/og?type=about"));
});

test("libraryMetadata generates correct metadata pointing to dynamic OG route", () => {
  const meta = libraryMetadata();
  assert.equal(meta.title, "Library");
  assert.equal(meta.alternates?.canonical, `${SITE_URL}/library`);
  const og = meta.openGraph as Record<string, unknown>;
  const images = og.images as Array<{ url: string }>;
  assert.ok(images[0].url.includes("/api/og?type=library"));
});

test("scribbleMetadata generates correct metadata pointing to dynamic OG route", () => {
  const meta = scribbleMetadata();
  assert.equal(meta.title, "Scribble");
  assert.equal(meta.alternates?.canonical, `${SITE_URL}/scribble`);
  const og = meta.openGraph as Record<string, unknown>;
  const images = og.images as Array<{ url: string }>;
  assert.ok(images[0].url.includes("/api/og?type=scribble"));
});

test("nowMetadata generates correct metadata pointing to dynamic OG route", () => {
  const meta = nowMetadata();
  assert.equal(meta.title, "Now");
  assert.equal(meta.alternates?.canonical, `${SITE_URL}/now`);
  const og = meta.openGraph as Record<string, unknown>;
  const images = og.images as Array<{ url: string }>;
  assert.ok(images[0].url.includes("/api/og?type=now"));
});

test("homeMetadata generates correct metadata pointing to dynamic OG route", () => {
  const meta = homeMetadata();
  const og = meta.openGraph as Record<string, unknown>;
  const images = og.images as Array<{ url: string }>;
  assert.ok(images[0].url.includes("/api/og?type=home"));
});

test("supportMetadata generates correct metadata pointing to dynamic OG route", () => {
  const meta = supportMetadata();
  assert.equal(meta.title, "Support & Patronage");
  assert.equal(meta.alternates?.canonical, `${SITE_URL}/support`);
  const og = meta.openGraph as Record<string, unknown>;
  const images = og.images as Array<{ url: string }>;
  assert.ok(images[0].url.includes("/api/og?type=support"));
});

// ── OG route handler tests ──────────────────────────────────────────────────

test("GET /api/og?type=about generates valid PNG and uses response caching", async () => {
  const { GET } = await import("../app/api/og/route");
  const { NextRequest } = await import("next/server");

  const req1 = new NextRequest(`${SITE_URL}/api/og?type=about`);
  const res1 = await GET(req1);
  assert.equal(res1.status, 200);
  assert.equal(res1.headers.get("content-type"), "image/png");
  assert.ok(res1.headers.get("cache-control")?.includes("public"));

  const buf1 = await res1.arrayBuffer();
  assert.ok(buf1.byteLength > 1000, "OG image buffer should be non-empty PNG");

  // Subsequent call should hit cache
  const req2 = new NextRequest(`${SITE_URL}/api/og?type=about`);
  const res2 = await GET(req2);
  assert.equal(res2.status, 200);
  assert.equal(res2.headers.get("x-og-cache"), "HIT");
  const buf2 = await res2.arrayBuffer();
  assert.equal(buf2.byteLength, buf1.byteLength);
});

test("OPTIONS /api/og returns 204 with CORS and cache headers", async () => {
  const { OPTIONS } = await import("../app/api/og/route");
  const res = await OPTIONS();
  assert.equal(res.status, 204);
  assert.equal(res.headers.get("access-control-allow-origin"), "*");
  assert.equal(res.headers.get("cross-origin-resource-policy"), "cross-origin");
});

// ── Google Tag Manager (GTM) ────────────────────────────────────────────────

test("getGtmId returns trimmed ID when configured and undefined when missing/empty", async () => {
  const { getGtmId } = await import("../lib/config/env");

  const originalGtmId = process.env.NEXT_PUBLIC_GTM_ID;
  try {
    process.env.NEXT_PUBLIC_GTM_ID = "GTM-KW8LD5TQ";
    assert.equal(getGtmId(), "GTM-KW8LD5TQ");

    process.env.NEXT_PUBLIC_GTM_ID = "  GTM-TRIMTEST  ";
    assert.equal(getGtmId(), "GTM-TRIMTEST");

    process.env.NEXT_PUBLIC_GTM_ID = '"GTM-DOUBLEQUOTE"';
    assert.equal(getGtmId(), "GTM-DOUBLEQUOTE");

    process.env.NEXT_PUBLIC_GTM_ID = "'GTM-SINGLEQUOTE'";
    assert.equal(getGtmId(), "GTM-SINGLEQUOTE");

    process.env.NEXT_PUBLIC_GTM_ID = "";
    assert.equal(getGtmId(), undefined);

    process.env.NEXT_PUBLIC_GTM_ID = '""';
    assert.equal(getGtmId(), undefined);

    delete process.env.NEXT_PUBLIC_GTM_ID;
    assert.equal(getGtmId(), undefined);
  } finally {
    if (originalGtmId !== undefined) {
      process.env.NEXT_PUBLIC_GTM_ID = originalGtmId;
    } else {
      delete process.env.NEXT_PUBLIC_GTM_ID;
    }
  }
});

