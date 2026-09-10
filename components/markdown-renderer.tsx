import React, { Fragment, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { isSafeUrl, slugify } from '@/lib/utils';
import {
  parseBlockAttributes,
  renderBlock,
} from '@/components/blocks/library';

// ── Types ──────────────────────────────────────────────────────────────────

export interface InlineToken {
  type:
    | 'text'
    | 'code'
    | 'link'
    | 'bold'
    | 'italic'
    | 'bold-italic'
    | 'strike'
    | 'footnote';
  content?: string;
  text?: string;
  href?: string;
  num?: number;
}

export interface MarkdownFigureProps {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
  priority?: boolean;
}

export interface MarkdownBlockOptions {
  isFirstIntroParagraph?: boolean;
  isFirstImage?: boolean;
  footnotes?: string[];
  gridColClass?: string;
}

// ── Inline Token Parser ───────────────────────────────────────────────────

/**
 * Parses inline markdown tokens (code, bold, italic, strikethrough, links, footnotes)
 * into a typed token stream.
 */
export function parseInlineTokens(text: string): InlineToken[] {
  if (!text) return [];
  const tokens: InlineToken[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    // 1. Footnote marker: ^[1] or [^1]
    const fnMatch = remaining.match(/^(\^\[(\d+)\]|\[\^(\d+)\])/);
    if (fnMatch) {
      const num = Number(fnMatch[2] || fnMatch[3]);
      tokens.push({ type: 'footnote', num });
      remaining = remaining.slice(fnMatch[0].length);
      continue;
    }

    // 2. Inline Code: `code`
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      tokens.push({ type: 'code', content: codeMatch[1] });
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // 3. Link: [label](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      tokens.push({ type: 'link', text: linkMatch[1], href: linkMatch[2] });
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // 4. Bold + Italic: ***text*** or ___text___
    const boldItalicMatch = remaining.match(/^(\*\*\*|___)(.+?)\1/);
    if (boldItalicMatch) {
      tokens.push({ type: 'bold-italic', content: boldItalicMatch[2] });
      remaining = remaining.slice(boldItalicMatch[0].length);
      continue;
    }

    // 5. Bold: **text** or __text__
    const boldMatch = remaining.match(/^(\*\*|__)(.+?)\1/);
    if (boldMatch) {
      tokens.push({ type: 'bold', content: boldMatch[2] });
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // 6. Strikethrough: ~~text~~
    const strikeMatch = remaining.match(/^~~(.+?)~~/);
    if (strikeMatch) {
      tokens.push({ type: 'strike', content: strikeMatch[1] });
      remaining = remaining.slice(strikeMatch[0].length);
      continue;
    }

    // 7. Italic: *text* or _text_
    const italicMatch = remaining.match(/^(\*|_)(.+?)\1/);
    if (italicMatch) {
      tokens.push({ type: 'italic', content: italicMatch[2] });
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Normal text slice up to next markdown marker
    const nextIdx = remaining.search(/(\^\[\d+\]|\[\^\d+\]|`|\*\*\*|___|\*\*|__|~~|\*|_|\[)/);
    if (nextIdx === -1) {
      tokens.push({ type: 'text', content: remaining });
      break;
    } else if (nextIdx === 0) {
      // Unmatched marker character, treat as plain text character
      tokens.push({ type: 'text', content: remaining[0] });
      remaining = remaining.slice(1);
    } else {
      tokens.push({ type: 'text', content: remaining.slice(0, nextIdx) });
      remaining = remaining.slice(nextIdx);
    }
  }

  // Consolidate consecutive text tokens
  const consolidated: InlineToken[] = [];
  for (const token of tokens) {
    if (token.type === 'text') {
      const prev = consolidated[consolidated.length - 1];
      if (prev && prev.type === 'text') {
        prev.content = (prev.content || '') + (token.content || '');
        continue;
      }
    }
    consolidated.push(token);
  }

  return consolidated;
}

/**
 * Renders inline markdown tokens into accessible, styled React elements.
 */
export function renderInlineTokens(
  text: string,
  options?: { footnotes?: string[] },
): ReactNode {
  if (!text) return null;
  const tokens = parseInlineTokens(text);

  return (
    <>
      {tokens.map((tok, idx) => {
        switch (tok.type) {
          case 'code':
            return (
              <code
                key={idx}
                className="rounded bg-night-soft px-1.5 py-0.5 font-mono text-[0.875em] font-medium text-accent border border-tinted/40 break-words selection:bg-accent/30"
              >
                {tok.content}
              </code>
            );

          case 'link': {
            const href = tok.href || '#';
            const safe = isSafeUrl(href);
            const isExternal = href.startsWith('http://') || href.startsWith('https://');

            if (!safe) {
              return <span key={idx}>{tok.text}</span>;
            }

            return (
              <Link
                key={idx}
                href={href}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className="font-normal text-accent underline decoration-accent/40 underline-offset-4 transition-colors hover:text-accent-hover hover:decoration-accent"
              >
                {tok.text}
              </Link>
            );
          }

          case 'bold-italic':
            return (
              <strong key={idx} className="font-semibold italic text-paper">
                {tok.content}
              </strong>
            );

          case 'bold':
            return (
              <strong key={idx} className="font-semibold text-paper">
                {tok.content}
              </strong>
            );

          case 'italic':
            return (
              <em key={idx} className="italic text-paper/90">
                {tok.content}
              </em>
            );

          case 'strike':
            return (
              <s key={idx} className="line-through text-ink-soft">
                {tok.content}
              </s>
            );

          case 'footnote':
            return (
              <sup key={idx}>
                <a
                  id={`fnref-${tok.num}`}
                  href={`#fn-${tok.num}`}
                  className="font-medium text-accent no-underline hover:underline transition-colors ml-0.5"
                  title={`Footnote ${tok.num}`}
                >
                  [{tok.num}]
                </a>
              </sup>
            );

          case 'text':
          default:
            return <Fragment key={idx}>{tok.content}</Fragment>;
        }
      })}
    </>
  );
}

// ── Shared Figure Component ───────────────────────────────────────────────

export function MarkdownFigure({
  src,
  alt,
  caption,
  className = '',
  priority = false,
}: MarkdownFigureProps) {
  const cleanSrc =
    src && !src.startsWith('http') && !src.startsWith('/') && !src.startsWith('blob:')
      ? `/${src}`
      : src;

  return (
    <figure className={`my-8 block ${className}`}>
      <div className="relative overflow-hidden rounded-xl border border-tinted/20 bg-post-card shadow-md">
        <Image
          src={cleanSrc}
          alt={alt || 'Document Image'}
          width={1200}
          height={675}
          sizes="(max-width: 640px) calc(100vw - 2.5rem), (max-width: 1024px) 720px, 800px"
          className="h-auto w-full object-contain object-center transition-all duration-300"
          loading={priority ? undefined : 'lazy'}
          priority={priority}
        />
      </div>
      {caption && (
        <figcaption className="mt-2.5 text-center font-serif text-xs italic text-ink-soft">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

// ── Shared YouTube Component ──────────────────────────────────────────────

export function MarkdownYouTube({
  id,
  className = '',
}: {
  id: string;
  className?: string;
}) {
  const cleanId = id
    .replace(/https?:\/\/(www\.)?youtube\.com\/watch\?v=/, '')
    .replace(/https?:\/\/youtu\.be\//, '');

  if (!cleanId) return null;

  return (
    <div
      className={`my-8 aspect-video w-full overflow-hidden rounded-xl border border-tinted/20 bg-black shadow-md ${className}`}
    >
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${cleanId}`}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full border-0"
      />
    </div>
  );
}

// ── Block Attribute Extractor Helper ───────────────────────────────────────

function extractAttribute(tagString: string, attrName: string): string | null {
  const regex = new RegExp(`${attrName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|{([^}]*)})`, 'i');
  const match = tagString.match(regex);
  return match ? match[1] || match[2] || match[3] || '' : null;
}

// ── Universal Markdown Block Renderer ─────────────────────────────────────

/**
 * Renders any single Markdown paragraph / block (text, code block, blockquote,
 * alert, image, video, table, list, horizontal rule, or custom block).
 */
export function renderMarkdownBlock(
  paragraph: string,
  keyPrefix: string | number,
  options?: MarkdownBlockOptions,
): ReactNode {
  if (!paragraph || !paragraph.trim()) return null;
  const trimmed = paragraph.trim();
  const colClass = options?.gridColClass || '';

  // 1. Horizontal Rule (---, ***, ___)
  if (/^(---|___|\*\*\*)$/.test(trimmed)) {
    return (
      <hr
        key={keyPrefix}
        className={`my-8 border-t border-tinted/20 ${colClass}`}
      />
    );
  }

  // 2. Subheadings (### Subheading or #### Subheading)
  if (trimmed.startsWith('### ')) {
    return (
      <h3
        key={keyPrefix}
        className={`mt-8 mb-2 font-serif text-xl font-normal text-paper md:text-2xl ${colClass}`}
      >
        {renderInlineTokens(trimmed.slice(4), { footnotes: options?.footnotes })}
      </h3>
    );
  }
  if (trimmed.startsWith('#### ')) {
    return (
      <h4
        key={keyPrefix}
        className={`mt-6 mb-2 font-serif text-lg font-normal text-paper md:text-xl ${colClass}`}
      >
        {renderInlineTokens(trimmed.slice(5), { footnotes: options?.footnotes })}
      </h4>
    );
  }

  // 3. Code Block (```lang ... ```)
  if (trimmed.startsWith('```')) {
    const lines = trimmed.split('\n');
    const firstLine = lines[0].trim();
    const lang = firstLine.slice(3).trim();
    const lastLineIsBackticks = lines[lines.length - 1].trim() === '```';
    const codeLines = lines.slice(1, lastLineIsBackticks ? -1 : undefined);
    const codeContent = codeLines.join('\n');

    return (
      <div
        key={keyPrefix}
        className={`relative my-6 overflow-hidden rounded-xl border border-tinted/30 bg-night-soft p-4 shadow-sm ${colClass}`}
      >
        {lang && (
          <div className="mb-2.5 flex items-center justify-between border-b border-tinted/20 pb-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-ink-soft">
              {lang}
            </span>
          </div>
        )}
        <pre className="overflow-x-auto font-mono text-[13px] leading-relaxed text-paper/90 selection:bg-accent/30">
          <code>{codeContent}</code>
        </pre>
      </div>
    );
  }

  // 4. Markdown Image block: ![alt](src) optionally with title or caption
  const mdImgMatch = trimmed.match(/^!\[([\s\S]*?)\]\(([\s\S]*?)\)(?:[\s\n]*([\s\S]*))?$/);
  if (mdImgMatch) {
    const alt = mdImgMatch[1]?.trim() || '';
    let src = mdImgMatch[2]?.trim() || '';
    let rawCaption = mdImgMatch[3]?.trim() || '';

    const titleMatch = src.match(/^(.*?)\s+["'](.*?)["']$/);
    if (titleMatch) {
      src = titleMatch[1];
      if (!rawCaption) rawCaption = titleMatch[2];
    }

    const caption = rawCaption.replace(/^(\*|_)+|(\*|_)+$/g, '').trim();

    return (
      <MarkdownFigure
        key={keyPrefix}
        src={src}
        alt={alt || 'Document Image'}
        caption={caption || undefined}
        className={colClass}
        priority={options?.isFirstImage}
      />
    );
  }

  // 5. MDX / HTML Image: <img ... /> or <Image ... />
  const htmlImgMatch = trimmed.match(/^<(img|Image)\s+([^>]*?)\/?>$/i);
  if (htmlImgMatch) {
    const tagContent = htmlImgMatch[2];
    const src = extractAttribute(tagContent, 'src') || extractAttribute(tagContent, 'path') || '';
    const alt = extractAttribute(tagContent, 'alt') || 'Document Image';
    const caption = extractAttribute(tagContent, 'caption') || undefined;

    if (src) {
      return (
        <MarkdownFigure
          key={keyPrefix}
          src={src}
          alt={alt}
          caption={caption}
          className={colClass}
          priority={options?.isFirstImage}
        />
      );
    }
  }

  // 6. YouTube Embed: <YouTube id="..." />
  const ytMatch = trimmed.match(/^<YouTube\s+([^>]*?)\/?>$/i);
  if (ytMatch) {
    const tagContent = ytMatch[1];
    const id = extractAttribute(tagContent, 'id') || extractAttribute(tagContent, 'src') || '';
    if (id) {
      return <MarkdownYouTube key={keyPrefix} id={id} className={colClass} />;
    }
  }

  // 7. Component Library Blocks (<Book ... />, <Post ... />, <Note ... />)
  const libraryMatch = trimmed.match(/^<([A-Z][A-Za-z]*)\s+([^>]*?)\/?>/);
  if (libraryMatch) {
    const attrs = parseBlockAttributes(libraryMatch[2]);
    const rendered = renderBlock(libraryMatch[1], attrs, `block-${keyPrefix}`);
    if (rendered) {
      return (
        <div key={keyPrefix} className={colClass}>
          {rendered}
        </div>
      );
    }
  }

  // 8. GitHub-style alerts: > [!NOTE], > [!TIP], > [!WARNING], > [!IMPORTANT], > [!CAUTION]
  if (trimmed.startsWith('>')) {
    const alertMatch = trimmed.match(/^>\s*\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]\s*(.*)$/im);
    if (alertMatch) {
      const alertType = alertMatch[1].toUpperCase();
      const body = trimmed
        .replace(/^>\s*\[!.*?\]\s*/im, '')
        .replace(/^>\s?/gm, '')
        .trim();

      return (
        <div
          key={keyPrefix}
          className={`my-6 rounded-xl border border-tinted/20 bg-post-card p-5 shadow-2xs ${colClass}`}
        >
          <div className="flex items-center gap-2">
            <span className="rounded bg-night px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-accent border border-tinted/20">
              {alertType}
            </span>
          </div>
          <div className="mt-2 text-sm leading-relaxed text-paper/90 font-serif space-y-1">
            {body.split('\n').map((line, lIdx) => (
              <p key={lIdx}>
                {renderInlineTokens(line, { footnotes: options?.footnotes })}
              </p>
            ))}
          </div>
        </div>
      );
    }

    // 9. Standard Markdown Blockquote
    const quoteLines: string[] = [];
    let attribution = '';
    const rawLines = trimmed.split('\n');

    for (const rawLine of rawLines) {
      if (!rawLine.trim().startsWith('>')) continue;
      const text = rawLine.replace(/^>\s?/, '').trim();
      if (text.startsWith('—') || text.startsWith('--')) {
        attribution = text.replace(/^—+\s?/, '');
      } else {
        quoteLines.push(text);
      }
    }

    const quoteText = quoteLines.join(' ').replace(/^["“]|["”]$/g, '');

    return (
      <blockquote
        key={keyPrefix}
        className={`my-8 rounded-2xl border-l-4 border-sea-blue bg-night-soft/60 p-6 ${colClass}`}
      >
        <p className="font-serif text-xl italic leading-relaxed text-paper md:text-2xl">
          “{quoteText}”
        </p>
        {attribution && (
          <cite className="mt-3 block text-sm not-italic text-ink-soft">
            — {attribution}
          </cite>
        )}
      </blockquote>
    );
  }

  // 10. Ordered and Unordered Lists
  if (/^(\*|-|\+)\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
    const isOrdered = /^\d+\.\s/.test(trimmed);
    const listLines = trimmed.split('\n');
    const items: string[] = [];

    for (const line of listLines) {
      const lTrimmed = line.trim();
      if (!lTrimmed) continue;
      const text = isOrdered
        ? lTrimmed.replace(/^\d+\.\s+/, '')
        : lTrimmed.replace(/^(\*|-|\+)\s+/, '');
      items.push(text);
    }

    if (isOrdered) {
      return (
        <ol
          key={keyPrefix}
          className={`my-4 list-decimal pl-6 space-y-2 text-base leading-[1.85] text-paper/85 font-serif ${colClass}`}
        >
          {items.map((item, idx) => (
            <li key={idx}>
              {renderInlineTokens(item, { footnotes: options?.footnotes })}
            </li>
          ))}
        </ol>
      );
    }

    return (
      <ul
        key={keyPrefix}
        className={`my-4 list-disc pl-6 space-y-2 text-base leading-[1.85] text-paper/85 font-serif ${colClass}`}
      >
        {items.map((item, idx) => (
          <li key={idx}>
            {renderInlineTokens(item, { footnotes: options?.footnotes })}
          </li>
        ))}
      </ul>
    );
  }

  // 11. Markdown Table
  if (trimmed.includes('|') && trimmed.includes('---')) {
    const tableLines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);
    if (tableLines.length >= 2) {
      const headerRow = tableLines[0]
        .split('|')
        .map((c) => c.trim())
        .filter(Boolean);
      const dataRows = tableLines.slice(2).map((rowLine) =>
        rowLine
          .split('|')
          .map((c) => c.trim())
          .filter(Boolean),
      );

      return (
        <div
          key={keyPrefix}
          className={`my-6 overflow-x-auto rounded-xl border border-tinted/20 bg-post-card p-1 shadow-2xs ${colClass}`}
        >
          <table className="w-full text-left text-sm font-sans">
            <thead className="border-b border-tinted/20 bg-night-soft text-xs font-semibold uppercase tracking-wider text-ink-soft">
              <tr>
                {headerRow.map((h, idx) => (
                  <th key={idx} className="px-4 py-3 font-medium">
                    {renderInlineTokens(h, { footnotes: options?.footnotes })}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-tinted/20">
              {dataRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-night-soft/40 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-4 py-3 text-paper">
                      {renderInlineTokens(cell, { footnotes: options?.footnotes })}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
  }

  // 12. Standard Paragraph with full inline markdown formatting
  return (
    <p
      key={keyPrefix}
      className={
        options?.isFirstIntroParagraph
          ? `leading-[1.85] first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:font-serif first-letter:text-6xl first-letter:leading-[0.8] first-letter:text-paper ${colClass}`
          : `leading-[1.85] ${colClass}`
      }
    >
      {renderInlineTokens(paragraph, { footnotes: options?.footnotes })}
    </p>
  );
}
