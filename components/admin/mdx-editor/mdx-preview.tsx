'use client';

import { useMemo } from 'react';
import type { Persona, BookCard } from '@/lib/types';
import { markdownToPostSections, postToDocs } from '@/lib/utils';
import { MDXView } from '@/components/mdx-view';
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
  docType?: 'post' | 'note' | 'now';
  location?: string;
  className?: string;
}

/**
 * Live preview matching `BlogPostView` (`components/blog-post.tsx`) and
 * `NotePageView` (`components/note-page.tsx`). Markdown is evaluated through
 * the same real MDX pipeline (`lib/mdx.tsx`) used by the public pages.
 */
export function MDXPreview({
  content,
  title,
  subtitle,
  persona,
  date,
  tags = ['craft', 'software'],
  docType,
  location,
  className = '',
}: MDXPreviewProps) {
  const docs = useMemo(() => {
    const { intro, sections } = markdownToPostSections(content);
    return postToDocs(intro, sections);
  }, [content]);

  const effectiveDate = date || new Date().toISOString().split('T')[0];

  // Now entries are a timeline log, not a full post: same layout the public
  // /now page renders (title + shared now blocks + Posted date + location).
  if (docType === 'now') {
    return (
      <div
        className={`h-full overflow-y-auto bg-night text-paper selection:bg-accent selection:text-white ${className}`}
      >
        <article className="mx-auto max-w-4xl px-6 py-10 sm:px-10 md:py-16">
          <div className="space-y-5 text-base leading-[1.85] text-paper/85 md:text-lg">
            <h3 className="font-serif text-2xl font-normal text-paper md:text-3xl">
              {title || 'Timeline Update'}
            </h3>

            <div className="space-y-5">
              <MDXView src={content} />
            </div>

            <p className="pt-2 text-xs font-mono uppercase tracking-wider text-ink-soft/80 border-t border-tinted/15">
              Posted{' '}
              {new Date().toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
              {location ? ` · ${location}` : ''}
            </p>
          </div>
        </article>
      </div>
    );
  }

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
                  <span className="mr-0.5 text-accent" aria-hidden="true">#</span>
                  {tag}
                </span>
              ))}
            </div>

            {/* Right: Pub. Date */}
            <div
              className="flex shrink-0 items-center gap-1 text-[11px] font-mono text-ink-soft sm:gap-1.5 sm:text-xs"
              title={`Published: ${effectiveDate}`}
            >
              <CalendarIcon className="h-3 w-3 text-ink-soft sm:h-3.5 sm:w-3.5" />
              <span className="font-sans text-paper/95">{effectiveDate}</span>
            </div>
          </div>
        </header>

        {/* Body Layout matching BlogPostView */}
        <div className="mt-10 space-y-10">
          {/* Intro Nodes with Drop Cap on the first text paragraph */}
          {docs.intro && (
            <div className="space-y-6">
              <MDXView src={docs.intro} intro />
            </div>
          )}

          {/* Empty state prompt */}
          {!docs.intro && docs.sections.length === 0 && (
            <div className="py-12 text-center text-sm italic text-ink-soft">
              Type on the left editor to preview your live post layout here...
            </div>
          )}

          {/* Sections */}
          {docs.sections.map((src, index) => (
            <section
              key={src.slice(0, 40) || `section-${index}`}
              className="mt-12"
            >
              <MDXView src={src} />
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}