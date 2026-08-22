import assert from "node:assert/strict";
import { test } from "node:test";
import {
  slugify,
  formatDisplayDate,
  formatNoteSnippet,
  sectionsToMarkdown,
  markdownToPostSections,
  isSafeUrl,
  sanitizeRedirectPath,
} from "../lib/utils";

// ── slugify ─────────────────────────────────────────────────────────────────

test("slugify converts text to kebab-case", () => {
  assert.equal(slugify("Hello World"), "hello-world");
  assert.equal(slugify("Building in Public, Carefully"), "building-in-public-carefully");
  assert.equal(slugify("  Leading and trailing spaces  "), "leading-and-trailing-spaces");
});

test("slugify handles special characters", () => {
  assert.equal(slugify("Post's Title!"), "posts-title");
  assert.equal(slugify("C++ & Java"), "c-java");
  assert.equal(slugify("élan"), "lan");
});

test("slugify handles empty and single-word input", () => {
  assert.equal(slugify(""), "");
  assert.equal(slugify("Hello"), "hello");
});

test("slugify collapses consecutive separators", () => {
  assert.equal(slugify("hello___world"), "hello-world");
  assert.equal(slugify("a  b  c"), "a-b-c");
});

// ── formatDisplayDate ───────────────────────────────────────────────────────

test("formatDisplayDate formats ISO dates", () => {
  const result = formatDisplayDate("2026-03-12");
  assert.ok(result.includes("Mar"), "should contain month abbreviation");
  assert.ok(result.includes("12"), "should contain day");
  assert.ok(result.includes("2026"), "should contain year");
});

test("formatDisplayDate passes through pre-formatted strings", () => {
  assert.equal(formatDisplayDate("2025"), "2025");
  assert.equal(formatDisplayDate("Mar 12, 2026"), "Mar 12, 2026");
});

test("formatDisplayDate handles empty input", () => {
  assert.equal(formatDisplayDate(""), "");
});

// ── sectionsToMarkdown ──────────────────────────────────────────────────────

test("sectionsToMarkdown converts intro and sections to markdown", () => {
  const intro = ["First paragraph.", "Second paragraph."];
  const sections = [
    {
      id: "section-1",
      heading: "First Section",
      paragraphs: ["Section body text."],
    },
  ];

  const md = sectionsToMarkdown(intro, sections);
  assert.ok(md.includes("First paragraph."));
  assert.ok(md.includes("## First Section"));
  assert.ok(md.includes("Section body text."));
});

test("sectionsToMarkdown handles figures and quotes", () => {
  const intro: string[] = [];
  const sections = [
    {
      id: "fig-section",
      heading: "With Figure",
      paragraphs: ["Text"],
      figure: { src: "/image.jpg", alt: "An image", caption: "Image caption" },
      quote: { text: "A quote", attribution: "Author" },
    },
  ];

  const md = sectionsToMarkdown(intro, sections);
  assert.ok(md.includes("![An image](/image.jpg)"));
  assert.ok(md.includes("*Image caption*"));
  assert.ok(md.includes("> A quote"));
  assert.ok(md.includes("> — Author"));
});

test("sectionsToMarkdown handles footnotes", () => {
  const intro: string[] = [];
  const sections = [
    {
      id: "fn-section",
      heading: "With Footnotes",
      paragraphs: ["Text with [^1] reference."],
      footnotes: ["This is a footnote."],
    },
  ];

  const md = sectionsToMarkdown(intro, sections);
  assert.ok(md.includes("[^1]: This is a footnote."));
});

test("sectionsToMarkdown handles empty input", () => {
  const md = sectionsToMarkdown([], []);
  assert.equal(md, "");
});

// ── markdownToPostSections ──────────────────────────────────────────────────

test("markdownToPostSections parses intro and sections", () => {
  const md = "Intro paragraph.\n\n## First Section\n\nSection body text.";
  const result = markdownToPostSections(md);

  assert.ok(result.intro.length > 0, "should have intro paragraphs");
  assert.equal(result.sections.length, 1);
  assert.equal(result.sections[0].heading, "First Section");
  assert.ok(result.sections[0].paragraphs.includes("Section body text."));
});

test("markdownToPostSections extracts footnotes", () => {
  const md = "## Section\n\nText [^1] reference.\n\n[^1]: Footnote content.";
  const result = markdownToPostSections(md);

  assert.equal(result.sections.length, 1);
  assert.ok(result.sections[0].footnotes);
  assert.equal(result.sections[0].footnotes![0], "Footnote content.");
});

test("markdownToPostSections handles empty input", () => {
  const result = markdownToPostSections("");
  assert.deepEqual(result.intro, []);
  assert.deepEqual(result.sections, []);
});

test("markdownToPostSections generates section IDs from headings", () => {
  const md = "## My Section Title\n\nBody text.";
  const result = markdownToPostSections(md);

  assert.equal(result.sections[0].id, "my-section-title");
});

// ── Security URL & Redirect Utilities ────────────────────────────────────────

test("isSafeUrl permits valid http, https, and internal relative paths", () => {
  assert.equal(isSafeUrl("https://example.com"), true);
  assert.equal(isSafeUrl("http://example.com/books/1"), true);
  assert.equal(isSafeUrl("/scribble"), true);
  assert.equal(isSafeUrl("/p/my-post"), true);
});

test("isSafeUrl rejects malicious schemes and relative protocol URLs", () => {
  assert.equal(isSafeUrl("javascript:alert(1)"), false);
  assert.equal(isSafeUrl("data:text/html,<script>alert(1)</script>"), false);
  assert.equal(isSafeUrl("vbscript:msgbox(1)"), false);
  assert.equal(isSafeUrl("//evil.com/phish"), false);
  assert.equal(isSafeUrl("/\\evil.com"), false);
  assert.equal(isSafeUrl(""), false);
  assert.equal(isSafeUrl(null as unknown as string), false);
});

test("sanitizeRedirectPath permits safe internal relative paths", () => {
  assert.equal(sanitizeRedirectPath("/admin"), "/admin");
  assert.equal(sanitizeRedirectPath("/admin/compose"), "/admin/compose");
  assert.equal(sanitizeRedirectPath("/scribble"), "/scribble");
});

test("sanitizeRedirectPath falls back on open redirect attempts", () => {
  assert.equal(sanitizeRedirectPath("https://evil.com", "/admin"), "/admin");
  assert.equal(sanitizeRedirectPath("//evil.com", "/admin"), "/admin");
  assert.equal(sanitizeRedirectPath("/\\evil.com", "/admin"), "/admin");
  assert.equal(sanitizeRedirectPath("javascript:alert(1)", "/admin"), "/admin");
  assert.equal(sanitizeRedirectPath("", "/admin"), "/admin");
  assert.equal(sanitizeRedirectPath(undefined, "/admin"), "/admin");
});

// ── formatNoteSnippet ───────────────────────────────────────────────────────

test("formatNoteSnippet returns full string if within limit", () => {
  assert.equal(formatNoteSnippet("Short note text", 50), "Short note text");
  assert.equal(formatNoteSnippet(["Short", "paragraph"], 50), "Short paragraph");
});

test("formatNoteSnippet truncates cleanly and appends ...read now when limit exceeded", () => {
  const longText = "This is a longer atomic note discussing architecture design principles and systems thinking across modern web applications.";
  const formatted = formatNoteSnippet(longText, 60);
  assert.ok(formatted.endsWith("...read now"), "snippet must end with ...read now");
  assert.ok(!formatted.includes("applications"), "exceeded text should be trimmed");
});

test("formatNoteSnippet handles empty input gracefully", () => {
  assert.equal(formatNoteSnippet(""), "");
  assert.equal(formatNoteSnippet([]), "");
  assert.equal(formatNoteSnippet(undefined), "");
});
