import Link from 'next/link';
import type { NoteItem, SectionGroup } from '@/lib/types';
import { SectionHeading } from './section-heading';
import { formatDisplayDate } from '@/lib/utils';

interface NotesSectionProps {
  notes: SectionGroup<NoteItem>;
}

export function NotesSection({ notes }: NotesSectionProps) {
  const items = notes.items;
  const mid = Math.ceil(items.length / 2);
  const stacks = [items.slice(0, mid), items.slice(mid)];

  return (
    <section aria-labelledby="home-notes-heading">
      <SectionHeading
        id="home-notes-heading"
        title={notes.title}
        href={notes.href}
        subheader={notes.subheader}
      />

      <div className="space-y-6">
        {stacks.map((stack, stackIndex) => (
          <div
            key={stackIndex}
            className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-1 sm:-mx-0 sm:px-0"
          >
            {stack.map((item) => (
              <article
                key={item.slug}
                className="group w-[80%] shrink-0 snap-start pr-6 sm:w-[46%] sm:pr-0"
              >
                <Link href={`/n/${item.slug}`} className="block">
                  <h4 className="font-serif text-lg font-normal leading-snug text-ink transition-colors duration-300 group-hover:text-accent">
                    {item.title}
                  </h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft line-clamp-3">
                    {item.description}
                  </p>
                  <p className="mt-2 text-xs text-ink-soft/80">
                    <span>{formatDisplayDate(item.date)}</span>
                  </p>
                </Link>
              </article>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}