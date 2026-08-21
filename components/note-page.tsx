import Link from 'next/link';
import type { NoteItem } from '@/lib/types';
import { formatDisplayDate } from '@/lib/utils';
import { ArrowLeftIcon } from './icons';
import { ShareMenu } from './share-menu';
import { PERSONA_LABELS } from '@/lib/constants';

function NoteFigure({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  return (
    <figure className="my-6 block">
      <div className="overflow-hidden rounded-xl border border-tinted/20 bg-post-card shadow-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="w-full h-auto max-h-[500px] object-cover object-center" loading="lazy" />
      </div>
      {(caption || alt) && (
        <figcaption className="mt-2.5 text-center font-serif text-xs italic text-ink-soft">
          {caption || alt}
        </figcaption>
      )}
    </figure>
  );
}

function renderNoteParagraphOrFigure(paragraph: string, index: number) {
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

    return <NoteFigure key={index} src={src} alt={alt || "Note Image"} caption={caption} />;
  }

  // 2. MDX / HTML Image: <img ... /> or <Image ... />
  const htmlImgMatch = trimmed.match(/^<(img|Image)\s+([^>]*?)\/?>$/i);
  if (htmlImgMatch) {
    const tagContent = htmlImgMatch[2];
    const srcMatch = tagContent.match(/(?:src|path)=["']([^"']+)["']/i);
    const altMatch = tagContent.match(/alt=["']([^"']+)["']/i);
    const capMatch = tagContent.match(/caption=["']([^"']+)["']/i);

    const src = srcMatch ? srcMatch[1] : "";
    const alt = altMatch ? altMatch[1] : "Note Image";
    const caption = capMatch ? capMatch[1] : "";

    if (src) {
      return <NoteFigure key={index} src={src} alt={alt} caption={caption} />;
    }
  }

  // Regular paragraph
  return (
    <p key={index} className="leading-[1.85]">
      {paragraph}
    </p>
  );
}

export function NotePageView({ note }: { note: NoteItem }) {
  const personaLabel = note.persona
    ? PERSONA_LABELS[note.persona] ?? note.persona
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
              {note.title}
            </h1>
            {(note.subtitle || note.description) && (
              <p className="mt-4 text-lg leading-relaxed text-ink-soft md:text-xl">
                {note.subtitle || note.description}
              </p>
            )}

            <hr className="my-6 border-t border-tinted/20" />

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-paper sm:text-sm">
              {personaLabel && (
                <span className="rounded-full border border-tinted/20 bg-night-soft/60 px-2.5 py-0.5 text-[10px] leading-none text-ink-soft sm:px-3 sm:py-1 sm:text-xs">
                  {personaLabel}
                </span>
              )}

              {note.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="hidden rounded-full border border-tinted/20 bg-night-soft/60 px-2 py-0.5 text-[10px] leading-none text-ink-soft sm:inline-flex sm:px-3 sm:py-1 sm:text-xs"
                >
                  {tag}
                </span>
              ))}

              {(personaLabel || note.tags.length > 0) && (
                <span className="text-ink-soft" aria-hidden>
                  ·
                </span>
              )}

              <span className="text-ink-soft">Pub.</span>
              <span className="text-paper">{formatDisplayDate(note.date)}</span>

              <span className="text-ink-soft" aria-hidden>
                ·
              </span>

              <ShareMenu
                title={note.title}
                description={note.description}
              />
            </div>
          </header>
        </div>
      </div>

      <div className="container-site mt-10 md:mt-14 lg:grid lg:grid-cols-[1fr_minmax(0,72ch)_1fr] lg:gap-8">
        <div className="lg:col-start-2 space-y-5 text-paper/85">
          {note.content.map((paragraph, index) =>
            renderNoteParagraphOrFigure(paragraph, index),
          )}
        </div>
      </div>
    </article>
  );
}
