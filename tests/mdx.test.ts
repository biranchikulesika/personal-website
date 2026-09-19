import assert from 'node:assert/strict';
import { test } from 'node:test';
import { postToDocs } from '../lib/utils';

// ── postToDocs (storage → per-segment MDX serialization) ───────────────────

test('postToDocs serializes intro and sections into per-segment MDX documents', () => {
  const intro = ['First paragraph.', 'Second paragraph.'];
  const sections = [
    {
      id: 'section-1',
      heading: 'First Section',
      paragraphs: ['Section body with *emphasis*.'],
    },
  ];

  const docs = postToDocs(intro, sections);

  assert.equal(docs.intro, 'First paragraph.\n\nSecond paragraph.');
  assert.equal(docs.sections.length, 1);
  assert.ok(docs.sections[0].includes('## First Section'));
  assert.ok(docs.sections[0].includes('Section body with *emphasis*.'));
});

test('postToDocs keeps figure captions MDX-native (image title syntax)', () => {
  const sections = [
    {
      id: 'fig',
      heading: 'With Figure',
      paragraphs: ['Text'],
      figure: { src: '/image.jpg', alt: 'An image', caption: 'Image caption' },
    },
  ];

  const docs = postToDocs([], sections);
  assert.ok(docs.sections[0].includes("![An image](/image.jpg 'Image caption')"));
});

test('postToDocs handles empty input', () => {
  const docs = postToDocs([], []);
  assert.equal(docs.intro, '');
  assert.deepEqual(docs.sections, []);
});

test('postToDocs scopes footnotes per section', () => {
  const sections = [
    {
      id: 'a',
      heading: 'A',
      paragraphs: ['Text [^1] reference.'],
      footnotes: ['First note.'],
    },
    {
      id: 'b',
      heading: 'B',
      paragraphs: ['More [^1] text.'],
      footnotes: ['Second note.'],
    },
  ];

  const docs = postToDocs([], sections);
  assert.ok(docs.sections[0].includes('[^1]: First note.'));
  assert.ok(docs.sections[1].includes('[^1]: Second note.'));
});

// ── Real MDX engine rules (via @mdx-js/mdx + remark-gfm) ───────────────────
// Pins the Markdown/MDX behaviors the renderer relies on: nested emphasis,
// escaping, GFM footnotes/tables/task-lists, and custom JSX blocks.

import { evaluate } from '@mdx-js/mdx';
import { Fragment, createElement } from 'react';
import * as runtime from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import remarkGfm from 'remark-gfm';

async function html(src: string): Promise<string> {
  const { default: Content } = await evaluate(src, {
    ...runtime,
    Fragment,
    remarkPlugins: [remarkGfm],
    useMDXComponents: () => ({
      YouTube: (p: { id: string }) =>
        createElement('div', { 'data-yt': p.id }, 'YOUTUBE'),
      Book: (p: { title: string }) =>
        createElement('div', { 'data-book': p.title }, 'BOOK'),
      blockquote: (p: { children: React.ReactNode }) =>
        createElement('blockquote', { 'data-cite': true }, p.children),
    }),
  });
  return renderToStaticMarkup(createElement(Content));
}

test('mdx handles nested emphasis and escaping (CommonMark rules)', async () => {
  const out = await html('***both*** and **a *b* c** and literal \\*not italic\\*');
  assert.ok(out.includes('<em><strong>both</strong></em>'));
  assert.ok(out.includes('<strong>a <em>b</em> c</strong>'));
  assert.ok(out.includes('literal *not italic*'));
});

test('mdx parses GFM footnotes', async () => {
  const out = await html('text with footnote[^1].\n\n[^1]: the note body');
  assert.ok(out.includes('data-footnote-ref'));
  assert.ok(out.includes('class="footnotes"'));
  assert.ok(out.includes('the note body'));
});

test('mdx parses GFM tables and task lists', async () => {
  const table = await html('| A | B |\n| --- | --- |\n| 1 | 2 |');
  assert.ok(table.includes('<table>'));
  assert.ok(table.includes('<td>1</td>'));

  const tasks = await html('- [x] done\n- [ ] todo');
  assert.ok(tasks.includes('type="checkbox"'));
  assert.ok(tasks.includes('checked'));
});

test('mdx renders custom JSX blocks from the components map', async () => {
  const out = await html('<YouTube id="dQw4w9WgXcQ" />\n\n<Book title="The Shallows" />');
  assert.ok(out.includes('data-yt="dQw4w9WgXcQ"'));
  assert.ok(out.includes('data-book="The Shallows"'));
});

test('mdx reads image title as caption attribute', async () => {
  const out = await html('![cap](/x.png "The Caption")');
  assert.ok(out.includes('title="The Caption"'));
});

// A lone markdown image is parsed into a paragraph, but the `img` override
// renders a <figure>, which cannot live inside <p>. `remarkStandaloneImages`
// (lib/mdx.tsx) hoists such images out of their paragraph at the AST level so
// the DOM stays valid.
import { remarkStandaloneImages } from '../lib/mdx';
import type { MDXComponents } from 'mdx/types';

function renderWith(components: Record<string, React.ComponentType>) {
  return async (src: string) => {
    const { default: Content } = await evaluate(src, {
      ...runtime,
      Fragment,
      remarkPlugins: [remarkGfm, remarkStandaloneImages],
      useMDXComponents: () => components as unknown as MDXComponents,
    });
    return renderToStaticMarkup(createElement(Content));
  };
}

test('image-only paragraphs are not wrapped in <p>', async () => {
  const render = renderWith({ img: (props: { src?: string }) => createElement('figure', props) });
  const out = await render('![alt](/x.png)');
  assert.ok(out.includes('<figure src="/x.png" alt="alt"></figure>'));
  assert.ok(!out.includes('<p>'));
  assert.ok(!out.includes('</p>'));
});

test('standalone images are hoisted inside list items and blockquotes too', async () => {
  const render = renderWith({ img: (props: { src?: string }) => createElement('figure', props) });
  const list = await render('- ![alt](/a.png)\n- text');
  assert.ok(list.includes('<figure src="/a.png" alt="alt"></figure>'), list);
  assert.ok(!list.includes('<p>'), list);

  const quote = await render('> ![alt](/a.png)');
  assert.ok(quote.includes('<figure src="/a.png" alt="alt"></figure>'), quote);
  assert.ok(!quote.includes('<p>'), quote);
});

test('images inside a paragraph are lifted out, splitting the paragraph', async () => {
  const render = renderWith({ img: (props: { src?: string }) => createElement('figure', props) });
  const out = await render('text ![alt](/a.png) more');
  assert.ok(out.includes('<p>text </p>'), out);
  assert.ok(out.includes('<p> more</p>'), out);
  assert.ok(out.includes('<figure src="/a.png" alt="alt"></figure>'), out);
  assert.ok(!out.includes('<p>text <figure'), out);
});

test('image followed by a caption line keeps the caption below the figure', async () => {
  const render = renderWith({ img: (props: { src?: string }) => createElement('figure', props) });
  const out = await render('![alt](/a.png)\n*caption*');
  assert.ok(out.includes('<figure src="/a.png" alt="alt"></figure>'), out);
  assert.ok(out.includes('<em>caption</em>'), out);
  assert.ok(!out.includes('<p><figure'), out);
  assert.ok(!out.includes('</figure></p>'), out);
});

// ── Real components map (lib/mdx.tsx) ───────────────────────────────────────

import { evaluateBestEffort, evaluateMdx } from '../lib/mdx';

test('paragraphs keep their text through the real components map', async () => {
  const { default: Content } = await evaluateMdx('hello **world** and *em* text');
  const out = renderToStaticMarkup(createElement(Content));
  assert.ok(out.includes('>hello <strong'));
  assert.ok(out.includes('>world</strong>'));
  assert.ok(out.includes('>em</em>'));
});

test('legacy Image/Figure/Video tags are provided so old posts compile', async () => {
  const components = await evaluateBestEffort(
    '<Image src="/a.png" alt="x" />\n\n<Video path="/v.mp4" />\n\n<Figure src="/f.jpg" caption="cap" />',
  );
  assert.equal(components.length, 1);
});

test('a malformed token degrades to healthy per-paragraph rendering', async () => {
  const components = await evaluateBestEffort('hello **world**\n\n<3 breaks\n\ngoodbye');
  assert.ok(components.length >= 2);
  const html = components.map((C) => renderToStaticMarkup(createElement(C)));
  assert.ok(html.some((h) => h.includes('hello')));
  assert.ok(html.some((h) => h.includes('goodbye')));
});