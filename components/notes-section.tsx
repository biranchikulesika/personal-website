import Link from 'next/link';
import type { NoteItem, SectionGroup } from '@/lib/types';
import { SectionHeading } from './section-heading';
import { formatDisplayDate, formatNoteSnippet } from '@/lib/utils';

interface NotesSectionProps {
  notes: SectionGroup<NoteItem>;
}

export function NotesSection({ notes }: NotesSectionProps) {
  const items = notes.items;

  return (
    <section aria-labelledby="home-notes-heading">
      <SectionHeading
        id="home-notes-heading"
        title={notes.title}
        subheader={notes.subheader}
      />

      {/* Clean vertical list of notes without card wrappers */}
      <div className="space-y-6">
        {items.map((item) => {
          const noteText =
            item.content && item.content.length > 0
              ? item.content
              : item.description;
          const snippet = formatNoteSnippet(noteText, 160);

          const isTruncated = snippet.endsWith('...read now');
          const mainSnippet = isTruncated ? snippet.slice(0, -11) : snippet;

          return (
            <article key={item.slug} className="group">
              <Link href={`/n/${item.slug}`} className="block">
                <h3 className="font-serif text-lg font-normal leading-snug text-paper transition-colors duration-200 group-hover:text-accent">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-mid line-clamp-3">
                  {mainSnippet}
                  {isTruncated && (
                    <span className="ml-1 inline font-medium text-accent/90 transition-colors group-hover:text-accent">
                      ...read now
                    </span>
                  )}
                </p>
                <p className="mt-2 text-xs text-gray-mid">
                  <span>{formatDisplayDate(item.date)}</span>
                </p>
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}