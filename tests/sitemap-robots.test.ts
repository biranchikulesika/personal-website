import assert from "node:assert/strict";
import { test } from "node:test";
import { TEST_DOMAIN } from "./fixtures";
import { InMemoryTestContentRepository } from "./in-memory-test-content-repository";
import { setContentRepositoryForTesting } from "../lib/repositories";

// ── Sitemap ─────────────────────────────────────────────────────────────────

test("sitemap includes all public static pages", async () => {
  setContentRepositoryForTesting(new InMemoryTestContentRepository());
  const { default: sitemap } = await import("../app/sitemap");
  const entries = await sitemap();

  const urls = entries.map((e) => e.url);

  assert.ok(urls.includes(TEST_DOMAIN), "should include homepage");
  assert.ok(urls.includes(`${TEST_DOMAIN}/about`), "should include about");
  assert.ok(urls.includes(`${TEST_DOMAIN}/library`), "should include library");
  assert.ok(urls.includes(`${TEST_DOMAIN}/scribble`), "should include scribble");
  assert.ok(urls.includes(`${TEST_DOMAIN}/now`), "should include now");
  assert.ok(urls.includes(`${TEST_DOMAIN}/support`), "should include support");
});

test("sitemap excludes admin routes", async () => {
  const { default: sitemap } = await import("../app/sitemap");
  const entries = await sitemap();

  const urls = entries.map((e) => e.url);
  assert.ok(!urls.some((u) => u.includes("/admin")), "should not include admin routes");
});

test("sitemap includes now page", async () => {
  const { default: sitemap } = await import("../app/sitemap");
  const entries = await sitemap();

  const urls = entries.map((e) => e.url);
  assert.ok(urls.includes(`${TEST_DOMAIN}/now`), "should include now page");
});

test("sitemap uses canonical domain", async () => {
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
  const { default: sitemap } = await import("../app/sitemap");
  const entries = await sitemap();

  for (const entry of entries) {
    const url = new URL(entry.url);
    assert.equal(url.protocol, "https:", `URL ${entry.url} should use https`);
    assert.ok(url.hostname, `URL ${entry.url} should have a hostname`);
  }
});

// ── Robots ──────────────────────────────────────────────────────────────────

test("robots allows public pages", async () => {
  const { default: robots } = await import("../app/robots");
  const result = robots();

  assert.ok(result.rules, "robots should have rules");
  const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
  const allow = Array.isArray(rules[0].allow) ? rules[0].allow : [rules[0].allow];
  assert.ok(allow.includes("/"), "should allow all public pages");
});

test("robots never mentions or exposes admin routes", async () => {
  const { default: robots } = await import("../app/robots");
  const result = robots();

  const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
  const rule = rules[0];
  assert.ok(rule, "rules should have at least one entry");
  if (rule.disallow) {
    const disallowed = Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow];
    assert.ok(
      !disallowed.some((d) => d.includes("admin")),
      "robots.txt must NEVER expose or mention admin routes",
    );
  }
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

test("robots includes sitemap URL and host", async () => {
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
  assert.equal(result.host, TEST_DOMAIN, "robots should have canonical host");
});
