import { PERSONA_LABELS } from "@/lib/constants";
import type { BlogPost, PostFigure, PostSection } from "@/lib/types";
import { formatDisplayDate } from "@/lib/utils";
import Link from "next/link";
import { Fragment } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarIcon,
  ChevronDownIcon,
  EditHistoryIcon,
  ExternalLinkIcon,
} from "./icons";
import { ShareMenu } from "./share-menu";
import { BookCover } from "./ui/book-cover";
import { PersonaBadge } from "./persona-badge";
import {
  renderMarkdownBlock,
  MarkdownFigure,
} from "./markdown-renderer";

function footnoteRefs(text: string): number[] {
  const refs = new Set<number>();
  const re = /(?:\^\[(\d+)\]|\[\^(\d+)\])/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    refs.add(Number(match[1] || match[2]));
  }
  return [...refs];
}

function Figure({ src, alt, caption, priority }: PostFigure & { priority?: boolean }) {
  return (
    <MarkdownFigure
      src={src}
      alt={alt}
      caption={caption}
      className="lg:col-start-1"
      priority={priority}
    />
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

function BookCardView({
  title,
  author,
  cover,
  link,
}: {
  title: string;
  author: string;
  note?: string;
  cover?: string;
  link?: string;
}) {
  const href = link || "/library";
  const isExternal = href.startsWith("http");

  return (
    <article className="group relative w-[42%] shrink-0 snap-start sm:w-[30%] md:w-[22%] lg:w-[calc(25%-0.75rem)]">
      <Link
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className="block"
      >
        <span className="absolute left-1/2 top-[34%] z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent px-3.5 py-1 text-xs font-semibold text-paper shadow-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          View
          <ExternalLinkIcon className="ml-1 inline h-[12px] w-[12px]" />
        </span>
        <BookCover title={title} cover={cover} />
        <span className="mt-3 block transition-transform duration-300 group-hover:translate-y-1">
          <p className="font-sans text-base font-normal leading-snug text-paper transition-colors duration-300 group-hover:text-accent">
            {title}
          </p>
          <p className="mt-1 text-xs text-ink-soft">{author}</p>
        </span>
      </Link>
    </article>
  );
}

export function BlogPostView({ post }: { post: BlogPost }) {
  const showToc = post.sections.length > 2;
  const personaLabel = post.persona
    ? (PERSONA_LABELS[post.persona] ?? post.persona)
    : null;

  return (
    <article className="pb-16 pt-8 md:pb-24 md:pt-12">
      <div className="container-site">
        <div className="lg:grid lg:grid-cols-[1fr_minmax(0,72ch)_1fr] lg:gap-8">
          {/* Top-left Scribble button — aligned with title on desktop */}
          <div className="hidden lg:block pt-3">
            <Link
              href="/scribble"
              className="group inline-flex items-center text-xs font-semibold uppercase tracking-wider text-ink-soft transition-colors hover:text-paper"
            >
              <span className="flex items-center overflow-hidden max-w-0 opacity-0 transition-all duration-300 ease-out group-hover:max-w-[20px] group-hover:opacity-100 group-hover:mr-1.5">
                <ArrowLeftIcon className="h-3.5 w-3.5 text-accent shrink-0 -translate-x-1 transition-transform duration-300 group-hover:translate-x-0" />
              </span>
              <span>Scribble</span>
            </Link>
          </div>

          <header className="lg:col-start-2 mx-auto w-full max-w-3xl lg:max-w-none">
            <h1 className="font-serif text-4xl font-normal leading-tight text-paper md:text-5xl">
              {post.title}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-ink-soft md:text-xl">
              {post.subtitle || post.description}
            </p>

            <div className="mt-8 flex w-full items-center justify-between gap-2.5 border-y border-tinted/20 py-2.5 sm:gap-3 sm:py-3">
              {/* Left: Persona Split Identifier Badge + Content Tags */}
              <div className="no-scrollbar flex min-w-0 shrink items-center gap-1.5 overflow-x-auto whitespace-nowrap sm:gap-2">
                <PersonaBadge persona={post.persona} />

                {post.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="hidden shrink-0 items-center rounded-md border border-tinted/30 bg-night-soft/40 px-1.5 py-0.5 font-mono text-[11px] text-ink-soft transition-colors hover:border-tinted/60 hover:text-paper sm:inline-flex sm:px-2 sm:text-xs"
                  >
                    <span className="mr-0.5 text-tinted/80">#</span>
                    {tag}
                  </span>
                ))}
              </div>

              {/* Right: Pub. / Ed. Dates & Elevated Share Menu */}
              <div className="flex shrink-0 items-center gap-2 font-mono text-[11px] whitespace-nowrap sm:gap-3 sm:text-xs">
                <div
                  className="flex shrink-0 items-center gap-1 text-ink-soft sm:gap-1.5"
                  title={`Published: ${formatDisplayDate(post.publishedAt)}`}
                >
                  <CalendarIcon className="h-3 w-3 text-ink-soft/80 sm:h-3.5 sm:w-3.5" />
                  <span className="font-sans text-paper/95">{formatDisplayDate(post.publishedAt)}</span>
                </div>

                {post.lastEditedAt !== post.publishedAt && (
                  <>
                    <span className="text-tinted" aria-hidden="true">·</span>
                    <div
                      className="flex shrink-0 items-center gap-1 text-ink-soft sm:gap-1.5"
                      title={`Last Edited: ${formatDisplayDate(post.lastEditedAt)}`}
                    >
                      <EditHistoryIcon className="h-3 w-3 text-ink-soft/80 sm:h-3.5 sm:w-3.5" />
                      <span className="font-sans text-paper/95">{formatDisplayDate(post.lastEditedAt)}</span>
                    </div>
                  </>
                )}

                <div className="h-3 w-[1px] bg-tinted/30 shrink-0 sm:h-3.5" aria-hidden="true" />

                <ShareMenu
                  title={post.title}
                  description={post.subtitle || post.description}
                />
              </div>
            </div>
          </header>
        </div>
      </div>

      {/* Body — TOC in the left gutter, ~72ch centered prose */}
      <div className="container-site mt-10 md:mt-14 lg:grid lg:grid-cols-[1fr_minmax(0,72ch)_1fr] lg:gap-8">
        {showToc && (
          <aside className="hidden lg:block" aria-label="Table of contents">
            <details open className="group sticky top-24">
              <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-soft transition-colors hover:text-paper">
                <span>Contents</span>
                <ChevronDownIcon className="h-3.5 w-3.5 text-ink-soft transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <TocList sections={post.sections} />
            </details>
          </aside>
        )}

        <div className="lg:col-start-2 lg:col-span-2 lg:grid lg:grid-cols-[minmax(0,72ch)_1fr] lg:items-start lg:gap-8">
          {(() => {
            let imageCount = 0;
            return (
              <>
                {/* Intro — the first paragraph gets a drop cap */}
                <div className="mt-8 space-y-5 lg:col-start-1 text-paper/85">
                  {post.intro.map((paragraph, index) => {
                    const isImg =
                      paragraph.trim().startsWith('![') ||
                      /^<(img|Image)\s/i.test(paragraph.trim());
                    const isFirstImage = isImg && imageCount === 0;
                    if (isImg) imageCount++;

                    return renderMarkdownBlock(paragraph, `intro-${index}`, {
                      isFirstIntroParagraph: index === 0,
                      isFirstImage,
                      gridColClass: "lg:col-start-1",
                    });
                  })}
                </div>

                {/* Sections */}
                {post.sections.map((section, sectionIndex) => {
                  return (
                    <section
                      key={section.id}
                      id={section.id}
                      className="mt-12 lg:col-start-1 lg:col-span-2 lg:grid lg:grid-cols-[minmax(0,72ch)_1fr] lg:items-start lg:gap-8 text-paper/85"
                    >
                      <h2 className="font-serif text-2xl text-paper md:text-3xl lg:col-start-1">
                        {section.heading}
                      </h2>

                      {section.paragraphs.map((paragraph, paragraphIndex) => {
                        const refs = section.footnotes ? footnoteRefs(paragraph) : [];
                        const isImg =
                          paragraph.trim().startsWith('![') ||
                          /^<(img|Image)\s/i.test(paragraph.trim());
                        const isFirstImage = isImg && imageCount === 0;
                        if (isImg) imageCount++;

                        return (
                          <Fragment key={paragraphIndex}>
                            {renderMarkdownBlock(
                              paragraph,
                              `sec-${sectionIndex}-${paragraphIndex}`,
                              {
                                footnotes: section.footnotes,
                                isFirstImage,
                                gridColClass: "lg:col-start-1",
                              },
                            )}
                            {refs.length > 0 && (
                              <aside
                                className="hidden lg:block col-start-2 space-y-3 pt-1 border-l-2 border-tinted/20 pl-3"
                                aria-label="Footnotes"
                              >
                                {refs.map((n) => (
                                  <p
                                    key={n}
                                    id={`fn-${n}`}
                                    className="text-[13px] leading-relaxed text-ink-soft"
                                  >
                                    <sup className="mr-1 font-medium text-accent">
                                      {n}
                                    </sup>
                                    {section.footnotes?.[n - 1]}
                                    <a
                                      href={`#fnref-${n}`}
                                      className="ml-1 text-accent hover:text-paper transition-colors"
                                      title="Back"
                                    >
                                      ↩
                                    </a>
                                  </p>
                                ))}
                              </aside>
                            )}
                          </Fragment>
                        );
                      })}

                      {section.figure && (
                        <Figure
                          {...section.figure}
                          priority={imageCount === 0}
                        />
                      )}

                      {section.quote && (
                        <blockquote className="mt-8 rounded-2xl border-l-4 border-sea-blue bg-night-soft/60 p-6 lg:col-start-1">
                          <p className="font-serif text-xl italic leading-relaxed text-paper md:text-2xl">
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
              </>
            );
          })()}

          {/* Book cards */}
          {post.books.length > 0 && (
            <section
              className="mt-16 lg:col-start-1"
              aria-labelledby="post-books-heading"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                <h2
                  id="post-books-heading"
                  className="font-serif text-2xl text-paper md:text-3xl"
                >
                  Recommended reading
                </h2>
                <Link
                  href="/library"
                  className="group hidden items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-accent sm:inline-flex"
                >
                  Browse the Library
                  <ArrowRightIcon className="h-4 w-4 text-sea-blue transition-transform duration-300 group-hover:translate-x-0.5" />
                </Link>
              </div>
              <div className="no-scrollbar -mx-4 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-4 pb-1 sm:-mx-0 sm:px-0">
                {post.books.map((book) => (
                  <BookCardView key={book.title} {...book} />
                ))}

                {/* Mobile "Browse the Library" end card */}
                <article className="group relative w-[42%] shrink-0 snap-start sm:hidden">
                  <Link href="/library" className="block h-full">
                    <div className="flex aspect-[2/3] flex-col items-center justify-center rounded-lg border border-dashed border-tinted/30 bg-night-soft/80 p-3 text-center transition-all duration-300 group-hover:border-accent group-hover:bg-night-soft">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-post-card ring-1 ring-tinted/20 transition-transform duration-300 group-hover:scale-110">
                        <ArrowRightIcon className="h-4 w-4 text-sea-blue transition-transform duration-300 group-hover:translate-x-0.5" />
                      </div>
                      <span className="mt-2.5 font-serif text-xs italic leading-tight text-ink-soft">
                        Library
                      </span>
                    </div>
                    <span className="mt-3 block transition-transform duration-300 group-hover:translate-y-1">
                      <p className="font-sans text-base font-normal leading-snug text-paper transition-colors duration-300 group-hover:text-accent">
                        Browse the Library
                      </p>
                    </span>
                  </Link>
                </article>
              </div>
            </section>
          )}
        </div>
      </div>
    </article>
  );
}
