import assert from "node:assert/strict";
import { test } from "node:test";
import { resetDatabase } from "../lib/data/mock-db";
import { ContentService } from "../lib/services/content.service";
import { TEST_DOMAIN } from "./fixtures";

// ── Sitemap ─────────────────────────────────────────────────────────────────

test("sitemap includes all public static pages", async () => {
  resetDatabase();
  // Dynamically import to get fresh data after reset
  const { default: sitemap } = await import("../app/sitemap");
  const entries = await sitemap();

  const urls = entries.map((e) => e.url);

  assert.ok(urls.includes(TEST_DOMAIN), "should include homepage");
  assert.ok(urls.includes(`${TEST_DOMAIN}/about`), "should include about");
  assert.ok(urls.includes(`${TEST_DOMAIN}/library`), "should include library");
  assert.ok(urls.includes(`${TEST_DOMAIN}/scribble`), "should include scribble");
});

test("sitemap includes published blog posts", async () => {
  resetDatabase();
  const service = new ContentService();

  // Create a published post
  await service.savePost(
    {
      slug: "sitemap-test-post",
      title: "Sitemap Test",
      description: "Test",
      tags: [],
      publishedAt: "2026-08-20",
      lastEditedAt: "2026-08-20",
      assumedAudience: "Test",
      intro: [],
      sections: [],
      books: [],
    },
    "builder",
  );

  const { default: sitemap } = await import("../app/sitemap");
  const entries = await sitemap();

  const postUrls = entries.filter((e) => e.url.includes("/p/"));
  assert.ok(postUrls.length > 0, "should include at least one blog post");

  await service.deletePost("sitemap-test-post");
});

test("sitemap includes published notes", async () => {
  resetDatabase();
  const service = new ContentService();

  // Create a published note
  await service.saveNote({
    id: "sitemap-test-note",
    slug: "sitemap-test-note",
    title: "Sitemap Test Note",
    description: "Test",
    content: ["Test"],
    date: "2026-08-20",
    persona: "thinker",
    tags: [],
  });

  const { default: sitemap } = await import("../app/sitemap");
  const entries = await sitemap();

  const noteUrls = entries.filter((e) => e.url.includes("/n/"));
  assert.ok(noteUrls.length > 0, "should include at least one note");

  await service.deleteNote("sitemap-test-note");
});

test("sitemap excludes admin routes", async () => {
  resetDatabase();
  const { default: sitemap } = await import("../app/sitemap");
  const entries = await sitemap();

  const urls = entries.map((e) => e.url);
  assert.ok(!urls.some((u) => u.includes("/admin")), "should not include admin routes");
});

test("sitemap excludes now page", async () => {
  resetDatabase();
  const { default: sitemap } = await import("../app/sitemap");
  const entries = await sitemap();

  const urls = entries.map((e) => e.url);
  assert.ok(!urls.includes(`${TEST_DOMAIN}/now`), "should not include now page");
});

test("sitemap uses canonical domain", async () => {
  resetDatabase();
  const { default: sitemap } = await import("../app/sitemap");
  const entries = await sitemap();

  for (const entry of entries) {
    assert.ok(
      entry.url.startsWith(TEST_DOMAIN),
      `URL ${entry.url} should use canonical domain`,
    );
  }
});

test("sitemap entries have valid URL format", async () => {
  resetDatabase();
  const { default: sitemap } = await import("../app/sitemap");
  const entries = await sitemap();

  for (const entry of entries) {
    const url = new URL(entry.url);
    assert.equal(url.protocol, "https:", `URL ${entry.url} should use https`);
    assert.ok(url.hostname, `URL ${entry.url} should have a hostname`);
  }
});

test("sitemap excludes unpublished posts", async () => {
  resetDatabase();
  const service = new ContentService();

  // Create an unpublished post
  const unpublishedPost = {
    slug: "unpublished-sitemap-test",
    title: "Unpublished Post",
    description: "Should not appear in sitemap",
    tags: ["test"],
    publishedAt: "2026-08-20",
    lastEditedAt: "2026-08-20",
    assumedAudience: "Test",
    intro: [],
    sections: [],
    books: [],
    status: "unpublished" as const,
  };
  await service.savePost(unpublishedPost, "builder");

  const { default: sitemap } = await import("../app/sitemap");
  const entries = await sitemap();

  const urls = entries.map((e) => e.url);
  assert.ok(
    !urls.includes(`${TEST_DOMAIN}/p/unpublished-sitemap-test`),
    "unpublished post should not appear in sitemap",
  );
});

// ── Robots ──────────────────────────────────────────────────────────────────

test("robots allows public pages", async () => {
  const { default: robots } = await import("../app/robots");
  const result = robots();

  assert.ok(result.rules, "robots should have rules");
  const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
  assert.equal(rules[0].allow, "/", "should allow all public pages");
});

test("robots disallows admin routes", async () => {
  const { default: robots } = await import("../app/robots");
  const result = robots();

  const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
  const rule = rules[0];
  assert.ok(rule, "rules should have at least one entry");
  assert.ok(rule.disallow, "rule should have disallow");
  assert.ok(rule.disallow.includes("/admin/"), "should disallow admin routes");
});

test("robots disallows API routes", async () => {
  const { default: robots } = await import("../app/robots");
  const result = robots();

  const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
  const rule = rules[0];
  assert.ok(rule, "rules should have at least one entry");
  assert.ok(rule.disallow, "rule should have disallow");
  assert.ok(rule.disallow.includes("/api/"), "should disallow API routes");
});

test("robots includes sitemap URL", async () => {
  const { default: robots } = await import("../app/robots");
  const result = robots();

  assert.ok(result.sitemap, "robots should have sitemap URL");
  const sitemapUrl = Array.isArray(result.sitemap)
    ? result.sitemap[0]
    : result.sitemap;
  assert.ok(
    sitemapUrl.includes("sitemap.xml"),
    "sitemap URL should point to sitemap.xml",
  );
  assert.ok(
    sitemapUrl.startsWith("https://"),
    "sitemap URL should use HTTPS",
  );
});
