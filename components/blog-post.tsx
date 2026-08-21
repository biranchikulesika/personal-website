import { PERSONA_LABELS } from "@/lib/constants";
import type { BlogPost, PostFigure, PostSection } from "@/lib/types";
import { formatDisplayDate } from "@/lib/utils";
import Link from "next/link";
import { Fragment } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  ExternalLinkIcon,
} from "./icons";
import { ShareMenu } from "./share-menu";
import { BookCover } from "./ui/book-cover";

/**
 * Inline rendering for post paragraphs. Handles `^[n]` footnote markers by
 * turning them into superscript anchors pointing at the section's footnote
 * list. Plain strings pass through untouched.
 */
function renderInline(
  text: string,
  _prefix: string,
  _footnotes: string[] | undefined,
) {
  const parts = text.split(/(\^\[\d+\])/g);
  const hasMarker = parts.some((p) => /^\^\[\d+\]$/.test(p));
  if (!hasMarker) return text;

  return parts.map((part, index) => {
    const match = part.match(/^\^\[(\d+)\]$/);
    if (!match) return part;
    const n = Number(match[1]);
    return (
      <sup key={index}>
        <a
          id={`fnref-${n}`}
          href={`#fn-${n}`}
          className="font-medium text-accent no-underline hover:underline"
          title={`Footnote ${n}`}
        >
          [{n}]
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
    <figure className="my-8 block lg:col-start-1">
      <div className="overflow-hidden rounded-xl border border-tinted/20 bg-post-card shadow-md">
        {/* eslint-disable-next-line @next/next/no-img-element -- user-authored content may reference arbitrary image hosts */}
        <img src={src} alt={alt} className="w-full h-auto max-h-[550px] object-cover object-center" loading="lazy" />
      </div>
      {(caption || alt) && (
        <figcaption className="mt-2.5 text-center font-serif text-xs italic text-ink-soft">
          {caption || alt}
        </figcaption>
      )}
    </figure>
  );
}

/**
 * Renders a post paragraph or rich markdown block (Image, Figure, YouTube, Alert, Quote).
 */
function renderParagraphOrFigure(
  paragraph: string,
  prefix: string,
  footnotes?: string[],
  isFirstIntroParagraph = false,
) {
  const trimmed = paragraph.trim();

  // 1. Markdown Image block: ![alt](src) optionally with title or next-line *caption*
  const mdImgMatch = trimmed.match(/^!\[([\s\S]*?)\]\(([\s\S]*?)\)(?:\s*\*([\s\S]*?)\*)?$/);
  if (mdImgMatch) {
    const alt = mdImgMatch[1];
    let src = mdImgMatch[2].trim();
    let caption = mdImgMatch[3] ? mdImgMatch[3].trim() : "";

    const titleMatch = src.match(/^(.*?)\s+["'](.*?)["']$/);
    if (titleMatch) {
      src = titleMatch[1];
      if (!caption) caption = titleMatch[2];
    }

    return <Figure key={prefix} src={src} alt={alt || "Document Image"} caption={caption} />;
  }

  // 2. MDX / HTML Image: <img ... /> or <Image ... />
  const htmlImgMatch = trimmed.match(/^<(img|Image)\s+([^>]*?)\/?>$/i);
  if (htmlImgMatch) {
    const tagContent = htmlImgMatch[2];
    const srcMatch = tagContent.match(/(?:src|path)=["']([^"']+)["']/i);
    const altMatch = tagContent.match(/alt=["']([^"']+)["']/i);
    const capMatch = tagContent.match(/caption=["']([^"']+)["']/i);

    const src = srcMatch ? srcMatch[1] : "";
    const alt = altMatch ? altMatch[1] : "Document Image";
    const caption = capMatch ? capMatch[1] : "";

    if (src) {
      return <Figure key={prefix} src={src} alt={alt} caption={caption} />;
    }
  }

  // 3. YouTube Embed: <YouTube id="..." />
  const ytMatch = trimmed.match(/^<YouTube\s+([^>]*?)\/?>$/i);
  if (ytMatch) {
    const idMatch = ytMatch[1].match(/(?:id|src)=["']([^"']+)["']/i);
    const cleanId = idMatch
      ? idMatch[1].replace(/https?:\/\/(www\.)?youtube\.com\/watch\?v=/, "").replace(/https?:\/\/youtu\.be\//, "")
      : "";
    if (cleanId) {
      return (
        <div key={prefix} className="my-8 aspect-video w-full overflow-hidden rounded-xl border border-tinted/20 bg-black shadow-md lg:col-start-1">
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
  }

  // 4. GitHub-style alerts: > [!NOTE], etc.
  if (trimmed.startsWith(">")) {
    const alertMatch = trimmed.match(/^>\s*\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]\s*(.*)$/im);
    if (alertMatch) {
      const alertType = alertMatch[1].toUpperCase();
      const body = trimmed.replace(/^>\s*\[!.*?\]\s*/im, "").replace(/^>\s?/gm, "").trim();
      return (
        <div key={prefix} className="my-6 rounded-xl border border-tinted/20 bg-post-card p-5 shadow-2xs lg:col-start-1">
          <span className="rounded bg-night px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-accent border border-tinted/20">
            {alertType}
          </span>
          <p className="mt-2 text-sm leading-relaxed text-paper/90 font-serif">
            {renderInline(body, prefix, footnotes)}
          </p>
        </div>
      );
    }
  }

  // Regular text paragraph
  return (
    <p
      key={prefix}
      className={
        isFirstIntroParagraph
          ? "leading-[1.85] first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:font-serif first-letter:text-6xl first-letter:leading-[0.8] first-letter:text-paper lg:col-start-1"
          : "leading-[1.85] lg:col-start-1"
      }
    >
      {renderInline(paragraph, prefix, footnotes)}
    </p>
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

            <hr className="my-6 border-t border-tinted/20" />

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-paper sm:text-sm">
              {personaLabel && (
                <span className="rounded-full border border-tinted/20 bg-night-soft/60 px-2.5 py-0.5 text-[10px] leading-none text-ink-soft sm:px-3 sm:py-1 sm:text-xs">
                  {personaLabel}
                </span>
              )}

              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="hidden rounded-full border border-tinted/20 bg-night-soft/60 px-2 py-0.5 text-[10px] leading-none text-ink-soft sm:inline-flex sm:px-3 sm:py-1 sm:text-xs"
                >
                  {tag}
                </span>
              ))}

              {(personaLabel || post.tags.length > 0) && (
                <span className="text-ink-soft" aria-hidden>
                  ·
                </span>
              )}

              <span className="text-ink-soft">Pub.</span>
              <span className="text-paper">{formatDisplayDate(post.publishedAt)}</span>
              {post.lastEditedAt !== post.publishedAt && (
                <span className="hidden sm:inline-flex sm:items-center sm:gap-x-2">
                  <span className="text-ink-soft" aria-hidden>
                    ·
                  </span>
                  <span className="text-ink-soft">Ed.</span>
                  <span className="text-paper">{formatDisplayDate(post.lastEditedAt)}</span>
                </span>
              )}

              <span className="text-ink-soft" aria-hidden>
                ·
              </span>

              <ShareMenu
                title={post.title}
                description={post.subtitle || post.description}
              />
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
          {/* Intro — the first paragraph gets a drop cap */}
          <div className="mt-8 space-y-5 lg:col-start-1 text-paper/85">
            {post.intro.map((paragraph, index) =>
              renderParagraphOrFigure(paragraph, `intro-${index}`, undefined, index === 0),
            )}
          </div>

          {/* Sections */}
          {post.sections.map((section, sectionIndex) => {
            const emitted = new Set<number>();
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
                  return (
                    <Fragment key={paragraphIndex}>
                      {renderParagraphOrFigure(
                        paragraph,
                        `sec-${sectionIndex}-${paragraphIndex}`,
                        section.footnotes,
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

                {section.figure && <Figure {...section.figure} />}

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
              <div className="no-scrollbar -mx-4 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-1 sm:-mx-0 sm:px-0">
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
