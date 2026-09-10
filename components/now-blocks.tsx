import { Fragment } from 'react';
import { MarkdownFigure, renderMarkdownBlock } from './markdown-renderer';
import {
  parseBlockAttributes,
  renderBlock,
} from './blocks/library';

/**
 * Shared inline + block markdown renderer for Now entry content. Used by both
 * the public Now page and the editor's live preview so they render identically.
 *
 * Image alt text / captions render exactly like post and note pages via
 * `MarkdownFigure` (shared figure in `markdown-renderer.tsx`).
 */
export function renderNowBlocks(
  content: string,
  priority = false,
): React.ReactNode[] {
  const lines = content.split('\n');
  const nodes: React.ReactNode[] = [];
  let key = 0;

  let para: string[] = [];
  let quote: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let inCode = false;
  let codeLang = '';
  let codeLines: string[] = [];

  const flushPara = () => {
    if (para.length > 0) {
      nodes.push(
        <p key={`p-${key++}`}>
          {renderNowInlineTokens(para.join(' '), `p-${key}`, priority)}
        </p>
      );
      para = [];
    }
  };
  const flushQuote = () => {
    if (quote.length > 0) {
      nodes.push(
        <blockquote
          key={`q-${key++}`}
          className="my-8 border-y border-tinted/20 py-6 text-center font-serif text-lg italic text-paper md:text-xl"
        >
          {quote.map((q, i) => (
            <span key={i}>{renderNowInlineTokens(q, `q-${key}-${i}`, priority)}</span>
          ))}
        </blockquote>
      );
      quote = [];
    }
  };
  const flushList = () => {
    if (list) {
      const items = list.items;
      if (list.ordered) {
        nodes.push(
          <ol key={`ol-${key++}`} className="my-6 list-decimal space-y-2 pl-6">
            {items.map((item, i) => (
              <li key={i}>{renderNowInlineTokens(item, `li-${key}-${i}`, priority)}</li>
            ))}
          </ol>
        );
      } else {
        nodes.push(
          <ul key={`ul-${key++}`} className="my-6 list-disc space-y-2 pl-6 marker:text-accent">
            {items.map((item, i) => (
              <li key={i}>{renderNowInlineTokens(item, `li-${key}-${i}`, priority)}</li>
            ))}
          </ul>
        );
      }
      list = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const t = line.trim();

    if (inCode) {
      if (t === '```') {
        inCode = false;
        nodes.push(
          <div
            key={`code-${key++}`}
            className="relative my-6 overflow-hidden rounded-xl border border-tinted/30 bg-night-soft p-4 shadow-sm"
          >
            {codeLang && (
              <div className="mb-2.5 flex items-center justify-between border-b border-tinted/20 pb-2">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-ink-soft">
                  {codeLang}
                </span>
              </div>
            )}
            <pre className="overflow-x-auto font-mono text-[13px] leading-relaxed text-paper/90 selection:bg-accent/30">
              <code>{codeLines.join('\n')}</code>
            </pre>
          </div>
        );
        codeLines = [];
        codeLang = '';
      } else {
        codeLines.push(line);
      }
      continue;
    }

    if (t.startsWith('```')) {
      flushPara();
      flushQuote();
      flushList();
      inCode = true;
      codeLang = t.slice(3).trim();
      continue;
    }

    if (!t) {
      flushPara();
      flushQuote();
      flushList();
      continue;
    }

    if (t.startsWith('>')) {
      flushPara();
      flushList();
      quote.push(t.replace(/^>\s?/, ''));
      continue;
    }

    if (/^#{2,3}\s/.test(t)) {
      flushPara();
      flushQuote();
      flushList();
      nodes.push(
        <h4 key={`h-${key++}`} className="mt-8 mb-2 font-serif text-xl font-normal text-paper">
          {renderNowInlineTokens(t.replace(/^#+\s/, ''), `h-${key}`, priority)}
        </h4>
      );
      continue;
    }

    if (/^[-*]\s/.test(t)) {
      flushPara();
      flushQuote();
      if (!list) list = { ordered: false, items: [] };
      list.items.push(t.replace(/^[-*]\s/, ''));
      continue;
    }

    if (/^\d+\.\s/.test(t)) {
      flushPara();
      flushQuote();
      if (!list || list.ordered === false) {
        flushList();
        list = { ordered: true, items: [] };
      }
      list.items.push(t.replace(/^\d+\.\s/, ''));
      continue;
    }

    if (/^(---|___|\*\*\*)$/.test(t)) {
      flushPara();
      flushQuote();
      flushList();
      nodes.push(<hr key={`hr-${key++}`} className="my-8 border-t border-tinted/20" />);
      continue;
    }

    // Standalone media: ![alt](src) / ![alt](src "caption") / <Image> / <img> / <YouTube>.
    // Delegates to the shared renderMarkdownBlock so alt text + captions render
    // exactly like post and note pages (MarkdownFigure).
    if (
      /^!\[[\s\S]*?\]\([\s\S]*?\)/.test(t) ||
      /^<(img|Image|YouTube)\s+[^>]*?\/?>/i.test(t)
    ) {
      flushPara();
      flushQuote();
      flushList();
      nodes.push(
        renderMarkdownBlock(t, `media-${key++}`, { isFirstImage: priority })
      );
      continue;
    }

    const blockMatch = t.match(/^<([A-Z][A-Za-z]*)\s+([^>]*?)\/?>/);
    if (blockMatch) {
      flushPara();
      flushQuote();
      flushList();
      const attrs = parseBlockAttributes(blockMatch[2]);
      const rendered = renderBlock(blockMatch[1], attrs, `block-${key++}`);
      if (rendered) {
        nodes.push(rendered);
        continue;
      }
    }

    para.push(t);
  }

  flushPara();
  flushQuote();
  flushList();
  return nodes;
}

/**
 * Inline markdown tokens for Now content: bold, italic, inline code, images,
 * and links. Inline images render as shared figures so captions match blog/note.
 */
function renderNowInlineTokens(
  text: string,
  keyBase: string,
  priority = false,
): React.ReactNode[] {
  const pattern =
    /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`|!\[[^\]]*\]\([^)]+\)|\[[^\]]+\]\([^)]+\))/g;
  return text.split(pattern).map((part, i) => {
    const key = `${keyBase}-${i}`;
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={key}
          className="rounded bg-night-soft px-1.5 py-0.5 font-mono text-[0.9em] text-paper ring-1 ring-tinted/20"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }
    const img = part.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (img) {
      return (
        <MarkdownFigure
          key={key}
          src={img[2]}
          alt={img[1] || 'Image'}
          priority={priority}
        />
      );
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      return (
        <a
          key={key}
          href={link[2]}
          target={link[2].startsWith('http') ? '_blank' : undefined}
          rel={link[2].startsWith('http') ? 'noopener noreferrer' : undefined}
          className="text-paper underline decoration-tinted/40 underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
        >
          {link[1]}
        </a>
      );
    }
    return <Fragment key={key}>{part}</Fragment>;
  });
}