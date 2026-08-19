import Link from 'next/link';
import type { NoteItem, SectionGroup } from '@/lib/types';
import { SectionHeading } from './section-heading';

interface NotesSectionProps {
  notes: SectionGroup<NoteItem>;
}

export function NotesSection({ notes }: NotesSectionProps) {
  return (
    <section aria-labelledby="home-notes-heading">
      <SectionHeading
        id="home-notes-heading"
        title={notes.title}
        subheader={notes.subheader}
      />

      <ul className="space-y-6">
        {notes.items.map((item) => (
          <li key={item.slug} className="group">
            <Link href={`/notes/${item.slug}`} className="block">
              <h4 className="font-serif text-lg font-normal leading-snug text-ink transition-colors duration-300 group-hover:text-accent">
                {item.title}
              </h4>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                {item.description}
              </p>
              <p className="mt-1 text-xs text-ink-soft/80">
                <span>{item.date}</span>
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}