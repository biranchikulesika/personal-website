import Link from 'next/link';
import type { NoteItem } from '@/lib/types';
import { ArrowLeftIcon } from './icons';

export function NotePageView({ note }: { note: NoteItem }) {
  return (
    <article className="pb-16 md:pb-24">
      <div className="container-site">
        <nav className="pt-8 md:pt-10" aria-label="Note navigation">
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
            {note.title}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-soft md:text-xl">
            {note.description}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink">
            {note.tags.slice(0, 3).map((tag) => (
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
            <span>{note.date}</span>
          </div>
        </header>
      </div>

      <div className="container-site mt-10 md:mt-14">
        <div className="mx-auto max-w-3xl space-y-5">
          {note.content.map((paragraph, index) => (
            <p key={index} className="leading-[1.85]">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </article>
  );
}
