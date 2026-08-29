import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  parseInlineTokens,
  renderInlineTokens,
  renderMarkdownBlock,
} from '../components/markdown-renderer';

// ── Inline Token Parsing & Formatting Tests ───────────────────────────────

test('parseInlineTokens parses inline code with exact content', () => {
  const text = 'Run `npm install @vercel/speed-insights` to install.';
  const tokens = parseInlineTokens(text);

  assert.equal(tokens.length, 3);
  assert.equal(tokens[0].type, 'text');
  assert.equal(tokens[0].content, 'Run ');
  assert.equal(tokens[1].type, 'code');
  assert.equal(tokens[1].content, 'npm install @vercel/speed-insights');
  assert.equal(tokens[2].type, 'text');
  assert.equal(tokens[2].content, ' to install.');
});

test('parseInlineTokens handles multiple inline codes and mixed tokens', () => {
  const text = 'Compare `let` and `const` in **JavaScript** with *TypeScript* and [guide](https://kulesika.in).';
  const tokens = parseInlineTokens(text);

  const codeTokens = tokens.filter((t) => t.type === 'code');
  assert.equal(codeTokens.length, 2);
  assert.equal(codeTokens[0].content, 'let');
  assert.equal(codeTokens[1].content, 'const');

  const boldToken = tokens.find((t) => t.type === 'bold');
  assert.ok(boldToken);
  assert.equal(boldToken?.content, 'JavaScript');

  const italicToken = tokens.find((t) => t.type === 'italic');
  assert.ok(italicToken);
  assert.equal(italicToken?.content, 'TypeScript');

  const linkToken = tokens.find((t) => t.type === 'link');
  assert.ok(linkToken);
  assert.equal(linkToken?.text, 'guide');
  assert.equal(linkToken?.href, 'https://kulesika.in');
});

test('parseInlineTokens handles strikethrough and bold-italic', () => {
  const text = 'This is ~~old text~~ and this is ***important***.';
  const tokens = parseInlineTokens(text);

  const strike = tokens.find((t) => t.type === 'strike');
  assert.ok(strike);
  assert.equal(strike?.content, 'old text');

  const boldItalic = tokens.find((t) => t.type === 'bold-italic');
  assert.ok(boldItalic);
  assert.equal(boldItalic?.content, 'important');
});

test('parseInlineTokens parses both footnote formats ^[1] and [^1]', () => {
  const text = 'Statement with footnote^[1] and another[^2].';
  const tokens = parseInlineTokens(text);

  const footnotes = tokens.filter((t) => t.type === 'footnote');
  assert.equal(footnotes.length, 2);
  assert.equal(footnotes[0].num, 1);
  assert.equal(footnotes[1].num, 2);
});

// ── Block Element Rendering Tests ──────────────────────────────────────────

test('renderMarkdownBlock handles code blocks', () => {
  const codeBlock = '```typescript\nconst message: string = "Hello World";\nconsole.log(message);\n```';
  const element = renderMarkdownBlock(codeBlock, 'test-code');
  assert.ok(element !== null);
});

test('renderMarkdownBlock handles GitHub-style alerts', () => {
  const alertBlock = '> [!NOTE]\n> This is an important editorial note.\n> Second line of note.';
  const element = renderMarkdownBlock(alertBlock, 'test-alert');
  assert.ok(element !== null);
});

test('renderMarkdownBlock handles blockquotes with author attribution', () => {
  const quoteBlock = '> "Simplicity is prerequisite for reliability."\n> — Edsger W. Dijkstra';
  const element = renderMarkdownBlock(quoteBlock, 'test-quote');
  assert.ok(element !== null);
});

test('renderMarkdownBlock handles ordered and unordered lists', () => {
  const uList = '- First item with `inline code`\n- Second item with **bold text**';
  const uElement = renderMarkdownBlock(uList, 'test-ul');
  assert.ok(uElement !== null);

  const oList = '1. Step one\n2. Step two with [link](https://example.com)';
  const oElement = renderMarkdownBlock(oList, 'test-ol');
  assert.ok(oElement !== null);
});

test('renderMarkdownBlock handles markdown tables', () => {
  const table = '| Command | Description |\n| --- | --- |\n| `npm test` | Runs test suite |\n| `npm run lint` | Runs linter |';
  const element = renderMarkdownBlock(table, 'test-table');
  assert.ok(element !== null);
});

test('renderMarkdownBlock handles images, YouTube embeds and headings', () => {
  const img = '![Cover Photo](/cover.jpg "A serene morning")';
  const imgEl = renderMarkdownBlock(img, 'test-img');
  assert.ok(imgEl !== null);

  const yt = '<YouTube id="dQw4w9WgXcQ" />';
  const ytEl = renderMarkdownBlock(yt, 'test-yt');
  assert.ok(ytEl !== null);

  const h3 = '### Subheading with `code`';
  const h3El = renderMarkdownBlock(h3, 'test-h3');
  assert.ok(h3El !== null);

  const hr = '---';
  const hrEl = renderMarkdownBlock(hr, 'test-hr');
  assert.ok(hrEl !== null);
});
