import Link from 'next/link';
import type { BookItem, SectionGroup } from '@/lib/types';
import { SectionHeading } from './section-heading';
import { ExternalLinkIcon } from './icons';

interface LibrarySectionProps {
  library: SectionGroup<BookItem>;
  limit?: number;
}

/**
 * Placeholder book cover, or the real cover image when one is set.
 */
function BookCover({ title, cover }: { title: string; cover?: string }) {
  if (cover) {
    return (
      <div className="aspect-[2/3] overflow-hidden rounded-lg shadow-sm ring-1 ring-tinted transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cover}
          alt={`${title} cover`}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }
  return (
    <div className="flex aspect-[2/3] items-center justify-center overflow-hidden rounded-lg bg-cream p-3 shadow-sm ring-1 ring-tinted transition-all duration-300 group-hover:scale-[1.02] group-hover:opacity-20 group-hover:shadow-md">
      <span className="text-center font-serif text-lg italic leading-snug text-ink-soft/50">
        {title}
      </span>
    </div>
  );
}

export function LibrarySection({ library, limit = 4 }: LibrarySectionProps) {
  const items = limit ? library.items.slice(0, limit) : library.items;

  return (
    <section aria-labelledby="home-library-heading">
      <SectionHeading
        id="home-library-heading"
        title={library.title}
        href={library.href}
        subheader={library.subheader}
      />

      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-1 sm:-mx-0 sm:px-0">
        {items.map((item) => (
          <article
            key={item.slug}
            className="group relative w-[42%] shrink-0 snap-start sm:w-[30%] md:w-[22%] lg:w-[calc(25%-0.75rem)]"
          >
            <Link href={library.href} className="block">
              <span className="absolute left-1/2 top-[34%] z-10 -translate-x-1/2 -translate-y-1/2 rounded bg-paper px-3 py-1 text-sm font-medium text-ink shadow-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                View
                <ExternalLinkIcon className="ml-1 inline h-[14px] w-[14px]" />
              </span>
              <BookCover title={item.title} cover={item.cover} />
              <span className="mt-3 block transition-transform duration-300 group-hover:translate-y-1">
                <p className="font-sans text-base font-normal leading-snug text-ink transition-colors duration-300 group-hover:text-accent">
                  {item.title}
                </p>
                <p className="mt-1 text-xs text-ink-soft">{item.author}</p>
              </span>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}