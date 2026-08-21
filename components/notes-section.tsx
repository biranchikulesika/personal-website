import Link from 'next/link';
import type { NoteItem, SectionGroup } from '@/lib/types';
import { SectionHeading } from './section-heading';
import { formatDisplayDate } from '@/lib/utils';

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
        {items.map((item) => (
          <article key={item.slug} className="group">
            <Link href={`/n/${item.slug}`} className="block">
              <h4 className="font-serif text-lg font-normal leading-snug text-paper transition-colors duration-200 group-hover:text-accent">
                {item.title}
              </h4>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-mid line-clamp-3">
                {item.description}
              </p>
              <p className="mt-2 text-xs text-gray-mid">
                <span>{formatDisplayDate(item.date)}</span>
              </p>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}