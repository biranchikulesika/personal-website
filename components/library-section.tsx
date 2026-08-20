import Link from 'next/link';
import type { BookItem, SectionGroup } from '@/lib/types';
import { SectionHeading } from './section-heading';
import { ExternalLinkIcon } from './icons';
import { BookCover } from './ui/book-cover';

interface LibrarySectionProps {
  library: SectionGroup<BookItem>;
  limit?: number;
}

export function LibrarySection({ library, limit = 4 }: LibrarySectionProps) {
  const items = limit ? library.items.slice(0, limit) : library.items;

  if (items.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="home-library-heading">
      <SectionHeading
        id="home-library-heading"
        title={library.title}
        href={library.href}
        subheader={library.subheader}
      />

      {/* Desktop Mode: 4 columns grid */}
      <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-4 sm:gap-6">
        {items.map((item) => (
          <article key={item.slug} className="group relative">
            <Link href={library.href} className="block">
              <span className="absolute left-1/2 top-[34%] z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent px-3.5 py-1 text-xs font-semibold text-paper shadow-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                View
                <ExternalLinkIcon className="ml-1 inline h-[12px] w-[12px]" />
              </span>
              <BookCover title={item.title} cover={item.cover} />
              <span className="mt-3 block transition-transform duration-300 group-hover:translate-y-1">
                <p className="font-sans text-base font-normal leading-snug text-paper transition-colors duration-300 group-hover:text-accent">
                  {item.title}
                </p>
                <p className="mt-1 text-xs text-gray-mid">{item.author}</p>
              </span>
            </Link>
          </article>
        ))}
      </div>

      {/* Mobile Mode: Sideways Scroll with End Card */}
      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-1 sm:hidden">
        {items.map((item) => (
          <article
            key={item.slug}
            className="group relative w-[42%] shrink-0 snap-start"
          >
            <Link href={library.href} className="block">
              <BookCover title={item.title} cover={item.cover} />
              <span className="mt-3 block">
                <p className="font-sans text-sm font-normal leading-snug text-paper transition-colors duration-300 group-hover:text-accent">
                  {item.title}
                </p>
                <p className="mt-1 text-xs text-gray-mid">{item.author}</p>
              </span>
            </Link>
          </article>
        ))}

        {/* Mobile "Browse the Library" end card */}
        {items.length > 0 && (
          <article className="group relative w-[42%] shrink-0 snap-start">
            <Link href={library.href} className="block h-full">
              <div className="flex aspect-[2/3] flex-col items-center justify-center rounded-lg border border-dashed border-tinted/30 bg-night-soft/80 p-3 text-center transition-all duration-300 group-hover:border-accent group-hover:bg-night-soft">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-post-card ring-1 ring-tinted/20 transition-transform duration-300 group-hover:scale-110">
                  <ExternalLinkIcon className="h-4 w-4 text-teal transition-transform duration-300 group-hover:translate-x-0.5" />
                </div>
                <span className="mt-2.5 font-serif text-xs italic leading-tight text-gray-mid">
                  Library
                </span>
              </div>
              <span className="mt-3 block transition-transform duration-300 group-hover:translate-y-1">
                <p className="font-sans text-sm font-normal leading-snug text-paper transition-colors duration-300 group-hover:text-accent">
                  Browse Library
                </p>
              </span>
            </Link>
          </article>
        )}
      </div>
    </section>
  );
}