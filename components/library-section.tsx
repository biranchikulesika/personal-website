import Link from 'next/link';
import type { BookItem, SectionGroup } from '@/lib/types';
import { SectionHeading } from './section-heading';
import { ExternalLinkIcon } from './icons';
import { BookCover } from './ui/book-cover';
import { isSafeUrl } from '@/lib/utils';

interface LibrarySectionProps {
  library: SectionGroup<BookItem>;
  limit?: number;
  featured?: BookItem[];
}

export function LibrarySection({ library, limit = 4, featured }: LibrarySectionProps) {
  const items = featured && featured.length > 0
    ? featured.slice(0, limit)
    : limit
      ? library.items.slice(0, limit)
      : library.items;

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
        {items.map((item) => {
          const safeLink = item.link && isSafeUrl(item.link) ? item.link : null;
          return (
            <article key={item.slug} className="group relative">
              <BookCover title={item.title} cover={item.cover} />
              <span className="mt-3 block transition-transform duration-300 group-hover:translate-y-1">
                <h3 className="font-sans text-base font-normal leading-snug text-paper transition-colors duration-300 group-hover:text-accent">
                  <Link
                    href={safeLink ?? library.href}
                    {...(safeLink ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="inline-flex items-center gap-1.5 focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                  >
                    <span>{item.title}</span>
                    {safeLink && (
                      <ExternalLinkIcon className="inline-block h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 text-ink-soft group-hover:text-accent" />
                    )}
                  </Link>
                </h3>
                <p className="mt-1 text-xs text-gray-mid">{item.author}</p>
              </span>
            </article>
          );
        })}
      </div>

      {/* Mobile Mode: Sideways Scroll with End Card */}
      <div className="no-scrollbar -mx-4 -mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-4 pt-4 pb-3 sm:hidden">
        {items.map((item) => {
          const safeLink = item.link && isSafeUrl(item.link) ? item.link : null;
          return (
            <article
              key={item.slug}
              className="group relative w-[42%] shrink-0 snap-start"
            >
              <BookCover title={item.title} cover={item.cover} />
              <span className="mt-3 block">
                <h3 className="font-sans text-sm font-normal leading-snug text-paper transition-colors duration-300 group-hover:text-accent">
                  <Link
                    href={safeLink ?? library.href}
                    {...(safeLink ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="inline-flex items-center gap-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                  >
                    <span>{item.title}</span>
                    {safeLink && (
                      <ExternalLinkIcon className="inline-block h-3 w-3 shrink-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 text-ink-soft group-hover:text-accent" />
                    )}
                  </Link>
                </h3>
                <p className="mt-1 text-xs text-gray-mid">{item.author}</p>
              </span>
            </article>
          );
        })}

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