'use client';

import React, { useMemo, Fragment } from 'react';
import type { Persona, BookCard } from '@/lib/types';
import { slugify } from '@/lib/utils';
import { renderMarkdownBlock } from '@/components/markdown-renderer';
import { PersonaBadge } from '@/components/persona-badge';
import { CalendarIcon } from '@/components/icons';

interface MDXPreviewProps {
  content: string;
  title?: string;
  subtitle?: string;
  persona?: Persona;
  date?: string;
  tags?: string[];
  targetAudience?: string;
  books?: BookCard[];
  className?: string;
}

interface ParsedSection {
  id: string;
  heading: string;
  nodes: React.ReactNode[];
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
  targetAudience,
  className = '',
}: MDXPreviewProps) {
  const { introNodes, sections, footnotes } = useMemo(() => {
    return parseMdxDocument(content, targetAudience);
  }, [content, targetAudience]);

  const sortedFootnotes = Array.from(footnotes.entries()).sort(
    (a, b) => Number(a[0]) - Number(b[0]),
  );

  const effectiveDate = date || new Date().toISOString().split('T')[0];

  return (
    <div
      className={`h-full overflow-y-auto bg-night text-paper selection:bg-accent selection:text-white ${className}`}
    >
      <article className="mx-auto max-w-4xl px-6 py-10 sm:px-10 md:py-16">
        {/* Real Post Header */}
        <header className="border-b border-tinted/20 pb-8">
          <h1 className="font-serif text-3xl font-normal leading-tight text-paper sm:text-4xl md:text-5xl">
            {title || 'Untitled Post'}
          </h1>

          {subtitle && (
            <p className="mt-4 text-lg leading-relaxed text-ink-soft md:text-xl">
              {subtitle}
            </p>
          )}

          <div className="no-scrollbar mt-8 flex w-full items-center justify-between gap-2.5 overflow-x-auto border-t border-tinted/20 pt-2.5 whitespace-nowrap sm:gap-3 sm:pt-3">
            {/* Left: Persona Split Identifier Badge + Content Tags */}
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <PersonaBadge persona={persona} />

              {tags.map((tag) => (
                <span
                  key={tag}
                  className="hidden shrink-0 items-center rounded-md border border-tinted/30 bg-night-soft/40 px-1.5 py-0.5 font-mono text-[11px] text-ink-soft transition-colors hover:border-tinted/60 hover:text-paper sm:inline-flex sm:px-2 sm:text-xs"
                >
                  <span className="mr-0.5 text-tinted/80">#</span>
                  {tag}
                </span>
              ))}
            </div>

            {/* Right: Pub. Date */}
            <div
              className="flex shrink-0 items-center gap-1 text-[11px] font-mono text-ink-soft sm:gap-1.5 sm:text-xs"
              title={`Published: ${effectiveDate}`}
            >
              <CalendarIcon className="h-3 w-3 text-ink-soft/80 sm:h-3.5 sm:w-3.5" />
              <span className="font-sans text-paper/95">{effectiveDate}</span>
            </div>
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
            <div className="py-12 text-center text-sm italic text-ink-soft">
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
              <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-soft mb-4">
                Footnotes
              </h2>
              <ol className="space-y-2 text-sm leading-relaxed text-ink-soft list-decimal pl-5">
                {sortedFootnotes.map(([num, text]) => (
                  <li
                    key={num}
                    id={`fn-${num}`}
                    className="target:bg-accent/10 target:ring-1 target:ring-accent/30 target:rounded transition-colors"
                  >
                    <span className="text-paper font-medium mr-1.5">{num}.</span>
                    {text}
                    <a
                      href={`#fnref-${num}`}
                      className="ml-1.5 text-accent hover:text-paper transition-colors"
                      title="Back to reference"
                    >
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

/**
 * Parses full MDX text into rich intro nodes and section nodes.
 */
function parseMdxDocument(
  content: string,
  initialAudience?: string,
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

    // Check for target audience callout in markdown
    if (
      trimmed.toLowerCase().startsWith('target audience:') ||
      trimmed.toLowerCase().startsWith('> target audience:')
    ) {
      currentAudience = trimmed.replace(/^>?\s*target audience:\s*/i, '');
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

    // 1. Horizontal Rule (---, ***, ___)
    if (/^(---|___|\*\*\*)$/.test(trimmed)) {
      nodes.push(
        renderMarkdownBlock(trimmed, `hr-${i}`)
      );
      i++;
      continue;
    }

    // 2. Subheading H3 / H4
    if (line.startsWith('### ') || line.startsWith('#### ')) {
      nodes.push(
        renderMarkdownBlock(line, `h-${i}`)
      );
      i++;
      continue;
    }

    // 3. Code Block (```lang ... ```)
    if (trimmed.startsWith('```')) {
      const codeLines: string[] = [line];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) {
        codeLines.push(lines[i]);
        i++;
      }

      nodes.push(
        renderMarkdownBlock(codeLines.join('\n'), `code-${i}`)
      );
      continue;
    }

    // 4. Alerts / Quotes (> [!NOTE], > quote)
    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i]);
        i++;
      }
      nodes.push(
        renderMarkdownBlock(quoteLines.join('\n'), `quote-${i}`)
      );
      continue;
    }

    // 5. Lists (Unordered & Ordered)
    if (/^(\*|-|\+)\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
      const isOrdered = /^\d+\.\s/.test(trimmed);
      const listLines: string[] = [];

      while (
        i < lines.length &&
        ((isOrdered && /^\d+\.\s/.test(lines[i].trim())) ||
          (!isOrdered && /^(\*|-|\+)\s/.test(lines[i].trim())))
      ) {
        listLines.push(lines[i]);
        i++;
      }

      nodes.push(
        renderMarkdownBlock(listLines.join('\n'), `list-${i}`)
      );
      continue;
    }

    // 6. Markdown Table
    if (trimmed.includes('|') && i + 1 < lines.length && lines[i + 1].includes('---')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().includes('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }

      nodes.push(
        renderMarkdownBlock(tableLines.join('\n'), `table-${i}`)
      );
      continue;
    }

    // 7. Single self-contained blocks (<Image />, <YouTube />, <Book />, <Post />, <Note />, ![alt](src))
    if (
      trimmed.startsWith('<Image') ||
      trimmed.startsWith('<img') ||
      trimmed.startsWith('<YouTube') ||
      trimmed.startsWith('![') ||
      /^<[A-Z][A-Za-z]*\s/.test(trimmed)
    ) {
      nodes.push(
        renderMarkdownBlock(trimmed, `block-${i}`)
      );
      i++;
      continue;
    }

    // 8. Standard Paragraph
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
        renderMarkdownBlock(paragraphText, `p-${i}`, {
          isFirstIntroParagraph: applyDropCap,
        })
      );
    }
  }

  return nodes;
}
