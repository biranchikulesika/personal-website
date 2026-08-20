'use client';

import React, { useMemo, useState, Fragment } from 'react';
import type { Persona, BookCard } from '@/lib/types';
import { slugify } from '@/lib/utils';
import {
  parseBlockAttributes,
  renderBlock,
} from '@/components/blocks/library';

interface MDXPreviewProps {
  content: string;
  title?: string;
  subtitle?: string;
  persona?: Persona;
  date?: string;
  tags?: string[];
  assumedAudience?: string;
  books?: BookCard[];
  className?: string;
}

/**
 * Enhanced Image component with fallback placeholder on error
 */
function PreviewImage({
  src,
  alt,
  caption,
  className = '',
}: {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
}) {
  const [hasError, setHasError] = useState(false);

  // Normalize src path if missing leading slash for relative assets
  const cleanSrc = src && !src.startsWith('http') && !src.startsWith('/') && !src.startsWith('blob:')
    ? `/${src}`
    : src;

  return (
    <figure className={`my-8 block ${className}`}>
      <div className="overflow-hidden rounded-xl border border-tinted/20 bg-post-card shadow-md">
        {hasError || !cleanSrc ? (
          <div className="flex aspect-[16/9] w-full flex-col items-center justify-center bg-night p-6 text-center text-gray-mid">
            <span className="text-3xl">🖼</span>
            <span className="mt-2 font-mono text-xs font-semibold text-paper">{alt || 'Image Asset'}</span>
            <span className="mt-1 font-mono text-[10px] text-gray-mid/70 truncate max-w-sm">{src || 'No source URL provided'}</span>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cleanSrc}
            alt={alt || 'Document Image'}
            onError={() => setHasError(true)}
            className="w-full h-auto max-h-[550px] object-cover object-center transition-all duration-300"
          />
        )}
      </div>
      {(caption || alt) && (
        <figcaption className="mt-2.5 text-center font-serif text-xs italic text-gray-mid">
          {caption || alt}
        </figcaption>
      )}
    </figure>
  );
}

/**
 * YouTube Embed component
 */
function PreviewYouTube({ id }: { id: string }) {
  const cleanId = id.replace(/https?:\/\/(www\.)?youtube\.com\/watch\?v=/, '').replace(/https?:\/\/youtu\.be\//, '');
  return (
    <div className="my-8 aspect-video w-full overflow-hidden rounded-xl border border-tinted bg-black shadow-md">
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

/**
 * Pixel-accurate live preview matching `BlogPostView` (`components/blog-post.tsx`)
 * and `NotePageView` (`components/note-page.tsx`).
 */
export function MDXPreview({
  content,
  title,
  subtitle,
  persona,
  date,
  tags = ['craft', 'software'],
  assumedAudience,
  books = [],
  className = '',
}: MDXPreviewProps) {
  const { introNodes, sections, parsedAudience, footnotes } = useMemo(() => {
    return parseMdxDocument(content, assumedAudience);
  }, [content, assumedAudience]);

  const sortedFootnotes = Array.from(footnotes.entries()).sort((a, b) => Number(a[0]) - Number(b[0]));

  const effectiveDate = date || new Date().toISOString().split('T')[0];

  return (
    <div className={`h-full overflow-y-auto bg-night text-paper selection:bg-accent selection:text-white ${className}`}>
      <article className="mx-auto max-w-4xl px-6 py-10 sm:px-10 md:py-16">
        {/* Real Post Header */}
        <header className="border-b border-tinted/20 pb-8">
          <h1 className="font-serif text-3xl font-normal leading-tight text-paper sm:text-4xl md:text-5xl">
            {title || 'Untitled Post'}
          </h1>

          {subtitle && (
            <p className="mt-4 text-lg leading-relaxed text-gray-mid md:text-xl">
              {subtitle}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm text-paper">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-tinted/20 px-3 py-0.5 text-xs text-gray-mid"
              >
                {tag}
              </span>
            ))}

            <span className="text-gray-mid" aria-hidden>
              ·
            </span>

            <span className="text-gray-mid">Pub.</span>
            <span>{effectiveDate}</span>

            {persona && (
              <>
                <span className="text-gray-mid" aria-hidden>
                  ·
                </span>
                <span className="capitalize text-teal font-medium">{persona}</span>
              </>
            )}
          </div>
        </header>

        {/* Body Layout matching BlogPostView */}
        <div className="mt-10 space-y-10">
          {/* Intro Nodes with Drop Cap on first text paragraph */}
          {introNodes.length > 0 && (
            <div className="space-y-6">
              {introNodes.map((node, index) => (
                <Fragment key={index}>{node}</Fragment>
              ))}
            </div>
          )}

          {/* Empty state prompt */}
          {introNodes.length === 0 && sections.length === 0 && (
            <div className="py-12 text-center text-sm italic text-gray-mid">
              Type on the left editor to preview your live post layout here...
            </div>
          )}

          {/* Sections */}
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="mt-12 space-y-6">
              <h2 className="font-serif text-2xl text-paper md:text-3xl">
                {section.heading}
              </h2>

              <div className="space-y-6">
                {section.nodes.map((node, nIdx) => (
                  <Fragment key={nIdx}>{node}</Fragment>
                ))}
              </div>
            </section>
          ))}

          {/* Footnotes */}
          {sortedFootnotes.length > 0 && (
            <section className="mt-16 pt-8 border-t border-tinted/20">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-mid mb-4">Footnotes</h2>
              <ol className="space-y-2 text-sm leading-relaxed text-gray-mid list-decimal pl-5">
                {sortedFootnotes.map(([num, text]) => (
                  <li key={num} id={`fn-${num}`} className="target:bg-accent/10 target:ring-1 target:ring-accent/30 target:rounded transition-colors">
                    <span className="text-paper font-medium mr-1.5">{num}.</span>
                    {text}
                    <a href={`#fnref-${num}`} className="ml-1.5 text-accent hover:text-paper transition-colors" title="Back to reference">
                      ↩
                    </a>
                  </li>
                ))}
              </ol>
            </section>
          )}

        </div>
      </article>
    </div>
  );
}

interface ParsedSection {
  id: string;
  heading: string;
  nodes: React.ReactNode[];
}



/**
 * Parses full MDX text into rich intro nodes and section nodes.
 */
function parseMdxDocument(
  content: string,
  initialAudience?: string
): {
  introNodes: React.ReactNode[];
  sections: ParsedSection[];
  parsedAudience?: string;
  footnotes: Map<string, string>;
} {
  if (!content || !content.trim()) {
    return { introNodes: [], sections: [], footnotes: new Map() };
  }

  const lines = content.split('\n');
  let currentAudience = initialAudience;

  const introLines: string[] = [];
  const sectionChunks: { heading: string; lines: string[] }[] = [];
  let currentChunk: { heading: string; lines: string[] } | null = null;
  const footnotes = new Map<string, string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Footnote definition: [^1]: text here
    const fnDefMatch = trimmed.match(/^\[\^(\d+)\]:\s*(.+)/);
    if (fnDefMatch) {
      footnotes.set(fnDefMatch[1], fnDefMatch[2]);
      continue;
    }

    // Check for Assumed Audience callout in markdown
    if (trimmed.toLowerCase().startsWith('assumed audience:') || trimmed.toLowerCase().startsWith('> assumed audience:')) {
      currentAudience = trimmed.replace(/^>?\s*assumed audience:\s*/i, '');
      continue;
    }

    if (line.startsWith('## ')) {
      const heading = line.slice(3).trim();
      currentChunk = { heading, lines: [] };
      sectionChunks.push(currentChunk);
    } else if (currentChunk) {
      currentChunk.lines.push(line);
    } else {
      introLines.push(line);
    }
  }

  // Parse Intro Lines into rich nodes with drop-cap on the first paragraph
  const introNodes = parseMdxLines(introLines, true);

  // Sections with parsed nodes
  const sections: ParsedSection[] = sectionChunks.map((chunk, idx) => {
    return {
      id: slugify(chunk.heading) || `section-${idx + 1}`,
      heading: chunk.heading,
      nodes: parseMdxLines(chunk.lines, false),
    };
  });

  return { introNodes, sections, parsedAudience: currentAudience, footnotes };
}

function extractAttribute(tagString: string, attrName: string): string | null {
  const regex = new RegExp(`${attrName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|{([^}]*)})`, 'i');
  const match = tagString.match(regex);
  return match ? (match[1] || match[2] || match[3] || '') : null;
}

function parseMdxLines(lines: string[], isIntro = false): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let isFirstParagraph = isIntro;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // Horizontal Rule
    if (/^(---|___|\*\*\*)$/.test(trimmed)) {
      nodes.push(
        <hr key={`hr-${i}`} className="my-8 border-t border-tinted" />
      );
      i++;
      continue;
    }

    // Subheading H3
    if (line.startsWith('### ')) {
      nodes.push(
        <h3 key={`h3-${i}`} className="font-serif text-xl font-normal text-ink mt-8 mb-2">
          {renderInlineTokens(line.slice(4))}
        </h3>
      );
      i++;
      continue;
    }

    // Code Block (```)
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;

      nodes.push(
        <div key={`code-${i}`} className="relative my-6 rounded-xl border border-tinted bg-ink p-4 text-xs font-mono text-paper shadow-sm overflow-x-auto">
          {lang && (
            <span className="absolute top-2.5 right-3 text-[10px] font-semibold uppercase tracking-widest text-ink-soft">
              {lang}
            </span>
          )}
          <pre className="mt-1 leading-relaxed">
            <code>{codeLines.join('\n')}</code>
          </pre>
        </div>
      );
      continue;
    }

    // Self-closing / MDX <Image ... /> or <img ... />
    const mdxImageMatch = trimmed.match(/<(Image|img)\s+([^>]*?)\/?>/i);
    if (mdxImageMatch) {
      const tagContent = mdxImageMatch[2];
      const src = extractAttribute(tagContent, 'path') || extractAttribute(tagContent, 'src') || '';
      const alt = extractAttribute(tagContent, 'alt') || 'Image';
      const caption = extractAttribute(tagContent, 'caption') || undefined;

      nodes.push(
        <PreviewImage
          key={`mdx-img-${i}`}
          src={src}
          alt={alt}
          caption={caption}
        />
      );
      i++;
      continue;
    }

    // YouTube Embed <YouTube id="..." />
    const youtubeMatch = trimmed.match(/<YouTube\s+([^>]*?)\/?>/i);
    if (youtubeMatch) {
      const tagContent = youtubeMatch[1];
      const id = extractAttribute(tagContent, 'id') || extractAttribute(tagContent, 'src') || '';
      nodes.push(<PreviewYouTube key={`yt-${i}`} id={id} />);
      i++;
      continue;
    }

    // Library blocks: <Book title="..." author="..." ... />
    const libraryMatch = trimmed.match(/^<([A-Z][A-Za-z]*)\s+([^>]*?)\/?>/);
    if (libraryMatch) {
      const attrs = parseBlockAttributes(libraryMatch[2]);
      const rendered = renderBlock(libraryMatch[1], attrs, `block-${i}`);
      if (rendered) {
        nodes.push(rendered);
        i++;
        continue;
      }
    }

    // Markdown Image: ![alt](src "caption") or ![alt](src)
    const mdImgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)/);
    if (mdImgMatch) {
      const alt = mdImgMatch[1];
      const rawSrc = mdImgMatch[2];
      let src = rawSrc;
      let caption = '';

      // Extract optional title "caption" inside (src "caption")
      const titleMatch = rawSrc.match(/^(.*?)\s+["'](.*?)["']$/);
      if (titleMatch) {
        src = titleMatch[1];
        caption = titleMatch[2];
      }

      // Check if next line is caption (*caption*)
      if (!caption && i + 1 < lines.length && /^\*(.*?)\*$/.test(lines[i + 1].trim())) {
        caption = lines[i + 1].trim().replace(/^\*|\*$/g, '');
        i++;
      }

      nodes.push(
        <PreviewImage
          key={`fig-${i}`}
          src={src}
          alt={alt}
          caption={caption}
        />
      );
      i++;
      continue;
    }

    // GitHub-style Alerts: > [!NOTE], > [!TIP], > [!WARNING], > [!IMPORTANT]
    const alertMatch = trimmed.match(/^>\s*\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]/i);
    if (alertMatch) {
      const alertType = alertMatch[1].toUpperCase();
      const alertLines: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        alertLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }

      nodes.push(
        <div
          key={`alert-${i}`}
          className="my-6 rounded-lg border border-tinted/20 bg-post-card p-5 shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <span className="rounded bg-night px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-accent border border-tinted/20">
              {alertType}
            </span>
          </div>
          <div className="mt-2 text-sm leading-relaxed text-paper space-y-1 font-serif">
            {alertLines.map((al, idx) => (
              <p key={idx}>{renderInlineTokens(al)}</p>
            ))}
          </div>
        </div>
      );
      continue;
    }

    // Real Blockquote matching BlogPostView
    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = [];
      let attribution = '';
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        const text = lines[i].replace(/^>\s?/, '').trim();
        if (text.startsWith('—') || text.startsWith('--')) {
          attribution = text.replace(/^—+\s?/, '');
        } else {
          quoteLines.push(text);
        }
        i++;
      }

      const quoteText = quoteLines.join(' ').replace(/^["“]|["”]$/g, '');

      nodes.push(
        <blockquote
          key={`quote-${i}`}
          className="mt-8 border-l-4 border-teal pl-6"
        >
          <p className="font-serif text-xl italic leading-relaxed text-paper md:text-2xl">
            “{quoteText}”
          </p>
          {attribution && (
            <cite className="mt-3 block text-sm not-italic text-gray-mid">
              — {attribution}
            </cite>
          )}
        </blockquote>
      );
      continue;
    }

    // Lists (Unordered & Ordered)
    if (/^(\*|-|\+)\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
      const isOrdered = /^\d+\.\s/.test(trimmed);
      const listItems: string[] = [];

      while (
        i < lines.length &&
        ((isOrdered && /^\d+\.\s/.test(lines[i].trim())) ||
          (!isOrdered && /^(\*|-|\+)\s/.test(lines[i].trim())))
      ) {
        const itemText = isOrdered
          ? lines[i].trim().replace(/^\d+\.\s/, '')
          : lines[i].trim().replace(/^(\*|-|\+)\s/, '');
        listItems.push(itemText);
        i++;
      }

      if (isOrdered) {
        nodes.push(
          <ol key={`ol-${i}`} className="my-4 list-decimal pl-6 space-y-2 text-base leading-[1.85] text-paper font-serif">
            {listItems.map((item, idx) => (
              <li key={idx}>{renderInlineTokens(item)}</li>
            ))}
          </ol>
        );
      } else {
        nodes.push(
          <ul key={`ul-${i}`} className="my-4 list-disc pl-6 space-y-2 text-base leading-[1.85] text-paper font-serif">
            {listItems.map((item, idx) => (
              <li key={idx}>{renderInlineTokens(item)}</li>
            ))}
          </ul>
        );
      }
      continue;
    }

    // Markdown Table
    if (trimmed.includes('|') && i + 1 < lines.length && lines[i + 1].includes('---')) {
      const headerRow = trimmed
        .split('|')
        .map((c) => c.trim())
        .filter(Boolean);
      i += 2;

      const bodyRows: string[][] = [];
      while (i < lines.length && lines[i].trim().includes('|')) {
        const rowCells = lines[i]
          .split('|')
          .map((c) => c.trim())
          .filter(Boolean);
        if (rowCells.length > 0) bodyRows.push(rowCells);
        i++;
      }

      nodes.push(
        <div key={`table-${i}`} className="my-6 overflow-x-auto rounded-lg border border-tinted/20 bg-post-card p-1 shadow-2xs">
          <table className="w-full text-left text-sm font-sans">
            <thead className="border-b border-tinted/20 bg-night-soft text-xs font-semibold uppercase tracking-wider text-gray-mid">
              <tr>
                {headerRow.map((h, idx) => (
                  <th key={idx} className="px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-tinted/20">
              {bodyRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-night-soft/40 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-4 py-3 text-paper">{renderInlineTokens(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Standard Paragraph
    const paragraphLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith('#') &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].trim().startsWith('>') &&
      !lines[i].trim().startsWith('---') &&
      !lines[i].trim().startsWith('<Image') &&
      !lines[i].trim().startsWith('<img') &&
      !lines[i].trim().startsWith('<YouTube') &&
      !lines[i].trim().startsWith('![') &&
      !/^<[A-Z][A-Za-z]*\s/.test(lines[i].trim()) &&
      !/^(\*|-|\+|\d+\.)\s/.test(lines[i].trim())
    ) {
      paragraphLines.push(lines[i].trim());
      i++;
    }

    if (paragraphLines.length > 0) {
      const paragraphText = paragraphLines.join(' ');
      const applyDropCap = isFirstParagraph;
      if (isFirstParagraph) isFirstParagraph = false;

      nodes.push(
        <p
          key={`p-${i}`}
          className={
            applyDropCap
              ? 'leading-[1.85] text-base text-paper font-serif first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:font-serif first-letter:text-6xl first-letter:leading-[0.8] first-letter:text-paper'
              : 'text-base leading-[1.85] text-paper font-serif'
          }
        >
          {renderInlineTokens(paragraphText)}
        </p>
      );
    }
  }

  return nodes;
}

/**
 * Inline tokens: images, links, bold, italic, inline code, footnotes
 */
function renderInlineTokens(text: string): React.ReactNode {
  if (!text) return null;

  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  while (remaining.length > 0) {
    // Inline Image ![alt](src)
    const inlineImgMatch = remaining.match(/^!\[(.*?)\]\((.*?)\)/);
    if (inlineImgMatch) {
      const alt = inlineImgMatch[1];
      const src = inlineImgMatch[2];
      parts.push(
        <PreviewImage
          key={`inline-img-${keyIdx++}`}
          src={src}
          alt={alt}
        />
      );
      remaining = remaining.slice(inlineImgMatch[0].length);
      continue;
    }

    // Footnote marker ^[1] — links to footnote definition
    const fnMatch = remaining.match(/^\^\[(\d+)\]/);
    if (fnMatch) {
      const num = fnMatch[1];
      parts.push(
        <sup key={`fn-${keyIdx++}`}>
          <a
            href={`#fn-${num}`}
            id={`fnref-${num}`}
            className="font-medium text-accent hover:text-ink transition-colors cursor-pointer"
            title={`Footnote ${num}`}
          >
            [{num}]
          </a>
        </sup>
      );
      remaining = remaining.slice(fnMatch[0].length);
      continue;
    }

    // Link [label](url)
    const linkMatch = remaining.match(/^\[(.*?)\]\((.*?)\)/);
    if (linkMatch) {
      const label = linkMatch[1];
      const href = linkMatch[2];
      parts.push(
        <a
          key={`link-${keyIdx++}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline decoration-tinted underline-offset-4 hover:text-ink transition-colors"
        >
          {label}
        </a>
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // Bold **text**
    const boldMatch = remaining.match(/^\*\*(.*?)\*\*/);
    if (boldMatch) {
      parts.push(
        <strong key={`bold-${keyIdx++}`} className="font-semibold text-ink">
          {boldMatch[1]}
        </strong>
      );
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Strikethrough ~~text~~
    const strikeMatch = remaining.match(/^~~(.*?)~~/);
    if (strikeMatch) {
      parts.push(
        <s key={`strike-${keyIdx++}`} className="line-through text-ink-soft">
          {strikeMatch[1]}
        </s>
      );
      remaining = remaining.slice(strikeMatch[0].length);
      continue;
    }

    // Italic *text* or _text_
    const italicMatch = remaining.match(/^(\*|_)(.*?)\1/);
    if (italicMatch) {
      parts.push(
        <em key={`italic-${keyIdx++}`} className="italic">
          {italicMatch[2]}
        </em>
      );
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Inline Code `code`
    const codeMatch = remaining.match(/^`(.*?)`/);
    if (codeMatch) {
      parts.push(
        <code
          key={`code-${keyIdx++}`}
          className="rounded bg-cream px-1.5 py-0.5 font-mono text-xs text-ink ring-1 ring-tinted"
        >
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Normal text
    const nextSpecial = remaining.search(/(!\[|\^\[\d+\]|\[|\*\*|\*|_|`|~~)/);
    if (nextSpecial === -1) {
      parts.push(remaining);
      break;
    } else if (nextSpecial === 0) {
      parts.push(remaining[0]);
      remaining = remaining.slice(1);
    } else {
      parts.push(remaining.slice(0, nextSpecial));
      remaining = remaining.slice(nextSpecial);
    }
  }

  return <>{parts}</>;
}
