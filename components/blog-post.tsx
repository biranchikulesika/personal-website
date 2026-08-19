import Link from 'next/link';
import { Fragment } from 'react';
import type { BlogPost, PostFigure, PostSection } from '@/lib/types';
import { ArrowLeftIcon, ArrowRightIcon, ChevronDownIcon } from './icons';

/**
 * Inline rendering for post paragraphs. Handles `^[n]` footnote markers by
 * turning them into superscript anchors pointing at the section's footnote
 * list. Plain strings pass through untouched.
 */
function renderInline(
  text: string,
  prefix: string,
  footnotes: string[] | undefined,
) {
  if (!footnotes || footnotes.length === 0) return text;

  const parts = text.split(/(\^\[\d+\])/g);
  return parts.map((part, index) => {
    const match = part.match(/^\^\[(\d+)\]$/);
    if (!match) return part;
    const n = Number(match[1]);
    return (
      <sup key={index}>
        <a
          id={`fnref-${prefix}-${n}`}
          href={`#fn-${prefix}-${n}`}
          className="font-medium text-accent no-underline"
        >
          {n}
        </a>
      </sup>
    );
  });
}

function footnoteRefs(text: string): number[] {
  const refs = new Set<number>();
  const re = /\^\[(\d+)\]/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    refs.add(Number(match[1]));
  }
  return [...refs];
}

function Figure({ src, alt, caption }: PostFigure) {
  return (
    <figure className="mt-8 lg:col-start-1">
      {/* eslint-disable-next-line @next/next/no-img-element -- remote placeholder photo, no next/image domain configured */}
      <img src={src} alt={alt} className="w-full rounded-lg shadow-md" />
      <figcaption className="mt-3 text-center text-sm text-ink-soft">
        {caption}
      </figcaption>
    </figure>
  );
}

function TocList({ sections }: { sections: PostSection[] }) {
  return (
    <ol className="mt-4 space-y-3">
      {sections.map((section) => (
        <li key={section.id}>
          <a
            href={`#${section.id}`}
            className="text-sm text-ink-soft transition-colors hover:text-accent"
          >
            {section.heading}
          </a>
        </li>
      ))}
    </ol>
  );
}

const BOOK_SPINES = ['bg-sea-blue', 'bg-accent', 'bg-ink/60'];

function BookCardView({
  title,
  author,
  note,
  index,
}: {
  title: string;
  author: string;
  note: string;
  index: number;
}) {
  return (
    <article className="group flex flex-col rounded-lg border border-tinted bg-cream p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative flex aspect-[2/3] items-center justify-center overflow-hidden rounded-md bg-paper ring-1 ring-tinted">
        <span className="px-4 text-center font-serif text-lg italic leading-snug text-ink-soft/60">
          {title}
        </span>
        <span
          className={`absolute left-0 top-0 h-full w-1.5 ${
            BOOK_SPINES[index % BOOK_SPINES.length]
          }`}
          aria-hidden
        />
      </div>
      <h3 className="mt-3 font-sans text-base font-normal leading-snug text-ink transition-colors duration-300 group-hover:text-accent">
        {title}
      </h3>
      <p className="mt-0.5 text-sm text-ink-soft">{author}</p>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft/80">{note}</p>
    </article>
  );
}

export function BlogPostView({ post }: { post: BlogPost }) {
  const showToc = post.sections.length > 2;

  return (
    <article className="pb-16 md:pb-24">
      <div className="container-site">
        {/* Back-link header */}
        <nav className="pt-8 md:pt-10" aria-label="Post navigation">
          <Link
            href="/scribble"
            className="group inline-flex items-center text-sm text-ink-soft transition-colors hover:text-accent"
          >
            <span className="inline-flex w-0 -translate-x-2 items-center overflow-hidden opacity-0 transition-all duration-300 ease-out group-hover:w-5 group-hover:translate-x-0 group-hover:opacity-100">
              <ArrowLeftIcon className="h-4 w-4 text-sea-blue" />
            </span>
            <span>Scribble</span>
          </Link>
        </nav>

        <header className="mx-auto mt-6 max-w-3xl">
          <h1 className="font-serif text-4xl font-normal leading-tight text-ink md:text-5xl">
            {post.title}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-soft md:text-xl">
            {post.description}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-tinted px-3 py-1 text-xs text-ink-soft"
              >
                {tag}
              </span>
            ))}

            <span className="text-ink-soft" aria-hidden>
              ·
            </span>

            <span className="text-ink-soft">Published</span>
            <span>{post.plantedAt}</span>
            {post.lastTendedAt !== post.plantedAt && (
              <>
                <span className="text-ink-soft" aria-hidden>
                  ·
                </span>
                <span className="text-ink-soft">Last edited</span>
                <span>{post.lastTendedAt}</span>
              </>
            )}
          </div>
        </header>
      </div>

      {/* Body — TOC in the left gutter, ~72ch centered prose */}
      <div className="container-site mt-10 md:mt-14 lg:grid lg:grid-cols-[1fr_minmax(0,72ch)_1fr] lg:gap-8">
        {showToc && (
          <aside className="hidden lg:block" aria-label="Table of contents">
            <details open className="group sticky top-24">
              <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-soft transition-colors hover:text-ink">
                <span>Contents</span>
                <ChevronDownIcon className="h-3.5 w-3.5 text-ink-soft transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <TocList sections={post.sections} />
            </details>
          </aside>
        )}

        <div className="lg:col-start-2 lg:col-span-2 lg:grid lg:grid-cols-[minmax(0,72ch)_1fr] lg:items-start lg:gap-8">
          {showToc && (
            <details className="group mb-8 lg:hidden">
              <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-soft transition-colors hover:text-accent">
                <span>Contents</span>
                <ChevronDownIcon className="h-3.5 w-3.5 text-ink-soft transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <TocList sections={post.sections} />
            </details>
          )}

          {/* Assumed audience */}
          <div className="rounded-lg border border-tinted bg-cream p-6 lg:col-start-1">
            <h2 className="font-serif text-xl text-ink">Assumed audience</h2>
            <p className="mt-2 leading-relaxed text-ink-soft">
              {post.assumedAudience}
            </p>
          </div>

          {/* Intro — the first paragraph gets a drop cap */}
          <div className="mt-8 space-y-5 lg:col-start-1">
            {post.intro.map((paragraph, index) => (
              <p
                key={index}
                className={
                  index === 0
                    ? 'leading-[1.85] first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:font-serif first-letter:text-6xl first-letter:leading-[0.8] first-letter:text-ink'
                    : 'leading-[1.85]'
                }
              >
                {renderInline(paragraph, `intro-${index}`, undefined)}
              </p>
            ))}
          </div>

          {/* Sections */}
          {post.sections.map((section, sectionIndex) => {
            const emitted = new Set<number>();
            return (
              <section
                key={section.id}
                id={section.id}
                className="mt-12 lg:col-start-1 lg:col-span-2 lg:grid lg:grid-cols-[minmax(0,72ch)_1fr] lg:items-start lg:gap-8"
              >
                <h2 className="font-serif text-2xl text-ink md:text-3xl lg:col-start-1">
                  {section.heading}
                </h2>

                {section.paragraphs.map((paragraph, paragraphIndex) => {
                  const refs = section.footnotes
                    ? footnoteRefs(paragraph).filter((n) => !emitted.has(n))
                    : [];
                  refs.forEach((n) => emitted.add(n));
                  return (
                    <Fragment key={paragraphIndex}>
                      <p className="leading-[1.85] lg:col-start-1">
                        {renderInline(
                          paragraph,
                          `sec-${sectionIndex}`,
                          section.footnotes,
                        )}
                      </p>
                      {refs.length > 0 && (
                        <aside
                          className="col-start-2 space-y-2 border-l-2 border-tinted pl-3 text-sm leading-relaxed text-ink-soft"
                          aria-label="Footnotes"
                        >
                          {refs.map((n) => (
                            <p key={n} id={`fn-sec-${sectionIndex}-${n}`}>
                              <sup className="mr-1 font-medium text-accent">
                                {n}
                              </sup>
                              {section.footnotes?.[n - 1]}
                            </p>
                          ))}
                        </aside>
                      )}
                    </Fragment>
                  );
                })}

                {section.figure && <Figure {...section.figure} />}

                {section.quote && (
                  <blockquote className="mt-8 border-l-4 border-sea-blue pl-6 lg:col-start-1">
                    <p className="font-serif text-xl italic leading-relaxed text-ink md:text-2xl">
                      “{section.quote.text}”
                    </p>
                    {section.quote.attribution && (
                      <cite className="mt-3 block text-sm not-italic text-ink-soft">
                        — {section.quote.attribution}
                      </cite>
                    )}
                  </blockquote>
                )}
              </section>
            );
          })}

          {/* Book cards */}
          {post.books.length > 0 && (
            <section
              className="mt-16 lg:col-start-1"
              aria-labelledby="post-books-heading"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                <h2
                  id="post-books-heading"
                  className="font-serif text-2xl text-ink md:text-3xl"
                >
                  Recommended reading
                </h2>
                <Link
                  href="/library"
                  className="group inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-accent"
                >
                  Browse the Library
                  <ArrowRightIcon className="h-4 w-4 text-sea-blue transition-transform duration-300 group-hover:translate-x-0.5" />
                </Link>
              </div>
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {post.books.map((book, index) => (
                  <BookCardView key={book.title} {...book} index={index} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </article>
  );
}