import { Fragment } from 'react';
import type { NowEntry } from '@/lib/types';
import {
  parseBlockAttributes,
  renderBlock,
} from '@/components/blocks/library';

/**
 * Inline markdown tokens: bold, italic, inline code, images, and links.
 */
function renderInlineTokens(text: string, keyBase: string): React.ReactNode[] {
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
          className="rounded bg-cream px-1.5 py-0.5 font-mono text-[0.9em] text-ink ring-1 ring-tinted"
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
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={key}
          src={img[2]}
          alt={img[1]}
          className="my-2 w-full rounded-xl border border-tinted shadow-sm"
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
          className="text-ink underline decoration-tinted underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
        >
          {link[1]}
        </a>
      );
    }
    return <Fragment key={key}>{part}</Fragment>;
  });
}

/**
 * Block-level markdown renderer for Now entry content. Handles paragraphs,
 * blockquotes, headings, lists, horizontal rules, code fences, images, and
 * library blocks (e.g. `<Book ... />`).
 */
function renderBlocks(content: string): React.ReactNode[] {
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
        <p key={`p-${key++}`}>{renderInlineTokens(para.join(' '), `p-${key}`)}</p>
      );
      para = [];
    }
  };
  const flushQuote = () => {
    if (quote.length > 0) {
      nodes.push(
        <blockquote
          key={`q-${key++}`}
          className="my-8 border-y border-tinted py-6 text-center font-serif text-lg italic text-ink md:text-xl"
        >
          {quote.map((q, i) => (
            <span key={i}>{renderInlineTokens(q, `q-${key}-${i}`)}</span>
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
          <ol key={`ol-${key++}`} className="my-4 list-decimal space-y-1.5 pl-6">
            {items.map((it, i) => (
              <li key={i}>{renderInlineTokens(it, `li-${key}-${i}`)}</li>
            ))}
          </ol>
        );
      } else {
        nodes.push(
          <ul key={`ul-${key++}`} className="my-4 list-disc space-y-1.5 pl-6">
            {items.map((it, i) => (
              <li key={i}>{renderInlineTokens(it, `li-${key}-${i}`)}</li>
            ))}
          </ul>
        );
      }
      list = null;
    }
  };

  for (const line of lines) {
    const t = line.trim();

    if (inCode) {
      if (t.startsWith('```')) {
        inCode = false;
        nodes.push(
          <div
            key={`code-${key++}`}
            className="my-6 overflow-x-auto rounded-xl border border-tinted bg-[#1a1713] p-4 font-mono text-xs leading-relaxed text-[#f5efe3] shadow-sm"
          >
            {codeLang && (
              <span className="mb-2 block text-[10px] font-semibold uppercase tracking-widest text-[#a09e99]">
                {codeLang}
              </span>
            )}
            <pre>
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
        <h3 key={`h-${key++}`} className="mt-8 mb-2 font-serif text-xl font-normal text-ink">
          {renderInlineTokens(t.replace(/^#+\s/, ''), `h-${key}`)}
        </h3>
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
      nodes.push(<hr key={`hr-${key++}`} className="my-8 border-t border-tinted" />);
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

    const imgMatch = t.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
    if (imgMatch) {
      flushPara();
      flushQuote();
      flushList();
      nodes.push(
        <figure key={`img-${key++}`} className="my-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgMatch[2]}
            alt={imgMatch[1]}
            className="w-full rounded-xl border border-tinted shadow-sm"
          />
        </figure>
      );
      continue;
    }

    para.push(t);
  }

  flushPara();
  flushQuote();
  flushList();
  return nodes;
}

interface NowPageViewProps {
  entries: NowEntry[];
}

export function NowPageView({ entries }: NowPageViewProps) {
  return (
    <div className="container-site py-10 md:py-16">
      <main className="mx-auto max-w-[760px]">
        {/* Header */}
        <header className="mb-14">
          <h1 className="font-serif text-4xl font-normal tracking-tight text-ink md:text-5xl lg:text-6xl">
            Now
          </h1>
          <h2 className="mt-3 font-serif text-xl font-light italic leading-relaxed text-ink-soft md:text-2xl">
            A sporadically updated log of what I’m reading, exploring, and thinking about
          </h2>
        </header>

        {/* Timeline Log Entries */}
        <div className="space-y-16">
          {entries.map((entry, index) => (
            <section
              key={entry.id}
              className="relative ml-2 border-l border-dashed border-tinted pl-8 md:ml-4 md:pl-12"
            >
              {/* Timeline node dot */}
              <span
                aria-hidden
                className={`absolute -left-[7px] top-2 h-3.5 w-3.5 rounded-full border-2 ${
                  index === 0 ? 'border-sea-blue' : 'border-tinted'
                } bg-cream shadow-sm`}
              />

              <article className="space-y-5 text-base leading-[1.85] text-ink-soft md:text-lg">
                <h3 className="font-serif text-2xl font-normal text-ink md:text-3xl">
                  {entry.title}
                </h3>

                <div className="space-y-5">{renderBlocks(entry.content)}</div>
              </article>
            </section>
          ))}
        </div>

        {/* Footer info & Now Movement Note */}
        <footer className="mt-20 border-t border-tinted pt-10 text-center">
          <p className="text-sm text-ink-soft">
            This page is inspired by the{' '}
            <a
              href="https://nownownow.com/about"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink underline decoration-tinted underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
            >
              /now movement
            </a>{' '}
            started by Derek Sivers.
          </p>
          {entries.length > 0 && (
            <p className="mt-3 font-serif text-base italic text-ink-soft/70">
              Odisha, India · Updated {entries[0].title}
            </p>
          )}
        </footer>
      </main>
    </div>
  );
}