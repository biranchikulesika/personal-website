import type { NoteItem } from '@/lib/types';
import { formatDisplayDate } from '@/lib/utils';
import { ShareMenu } from './share-menu';

const PERSONA_LABELS: Record<string, string> = {
  builder: 'Builder',
  operator: 'Operator',
  thinker: 'Thinker',
  wanderer: 'Wanderer',
};

export function NotePageView({ note }: { note: NoteItem }) {
  const personaLabel = note.persona
    ? PERSONA_LABELS[note.persona] ?? note.persona
    : null;

  return (
    <article className="pb-16 pt-8 md:pb-24 md:pt-12">
      <div className="container-site">
        <header className="mx-auto max-w-3xl">
          <h1 className="font-serif text-4xl font-normal leading-tight text-ink md:text-5xl">
            {note.title}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-soft md:text-xl">
            {note.description}
          </p>

          <hr className="my-6 border-t border-tinted" />

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink sm:text-sm">
            {personaLabel && (
              <span className="rounded-full border border-tinted px-2.5 py-0.5 text-[10px] leading-none text-ink-soft sm:px-3 sm:py-1 sm:text-xs">
                {personaLabel}
              </span>
            )}

            {note.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="hidden rounded-full border border-tinted px-2 py-0.5 text-[10px] leading-none text-ink-soft sm:inline-flex sm:px-3 sm:py-1 sm:text-xs"
              >
                {tag}
              </span>
            ))}

            {(personaLabel || note.tags.length > 0) && (
              <span className="text-ink-soft" aria-hidden>
                ·
              </span>
            )}

            <span className="text-ink-soft">Published</span>
            <span>{formatDisplayDate(note.date)}</span>

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
