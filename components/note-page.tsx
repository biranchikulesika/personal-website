import { StageLink as Link } from '@/components/paint-transition';
import type { NoteItem } from '@/lib/types';
import { formatDisplayDate } from '@/lib/utils';
import { renderMdx } from '@/lib/mdx';
import { ArrowLeftIcon, CalendarIcon } from './icons';
import { ShareMenu } from './share-menu';
import { PersonaBadge } from './persona-badge';

export async function NotePageView({ note }: { note: NoteItem }) {
  return (
    <article className="pb-16 pt-8 md:pb-24 md:pt-12">
      <div className="container-site">
        <div className="lg:grid lg:grid-cols-[1fr_minmax(0,72ch)_1fr] lg:gap-8">
          {/* Top-left Scribble button, aligned with title on desktop */}
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

            <div className="mt-8 flex w-full items-center justify-between gap-2.5 border-y border-tinted/20 py-2.5 sm:gap-3 sm:py-3">
              {/* Left: Persona Identifier Badge */}
              <PersonaBadge persona={note.persona} showIcon={false} />

              {/* Right: Pub. Date & Elevated Share Menu */}
              <div className="ml-auto flex shrink-0 items-center gap-2 font-mono text-[11px] whitespace-nowrap sm:gap-3 sm:text-xs">
                <div
                  className="flex shrink-0 items-center gap-1.5 text-ink-soft"
                  title={`Published: ${formatDisplayDate(note.date)}`}
                >
                  <CalendarIcon className="h-3 w-3 shrink-0 text-ink-soft sm:h-3.5 sm:w-3.5" />
                  <span className="font-sans leading-none text-paper/95">{formatDisplayDate(note.date)}</span>
                </div>

                <div className="h-3 w-[1px] bg-tinted/30 shrink-0 sm:h-3.5" aria-hidden="true" />

                <ShareMenu
                  title={note.title}
                  description={note.description}
                />
              </div>
            </div>
          </header>
        </div>
      </div>

      <div className="container-site mt-10 md:mt-14 lg:grid lg:grid-cols-[1fr_minmax(0,72ch)_1fr] lg:gap-8">
        <div className="lg:col-start-2 text-paper/85">
          {await renderMdx(note.content.join('\n\n'))}
        </div>
      </div>
    </article>
  );
}
