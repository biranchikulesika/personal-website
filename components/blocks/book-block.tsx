import type { NowBook } from '@/lib/types';

/**
 * BookBlock — a reusable MDX block component rendered from a `<Book ... />`
 * tag inside markdown content. Used in the editor preview and the public
 * Now page.
 */
export function BookBlock({ title, author, description, cover, link }: NowBook) {
  return (
    <div className="my-8 flex flex-col items-center gap-6 rounded-2xl border border-tinted bg-cream p-5 shadow-sm transition-all duration-300 hover:shadow-md sm:flex-row sm:items-start md:p-6">
      {/* Book Cover */}
      <div className="relative flex aspect-[2/3] w-28 shrink-0 flex-col justify-between overflow-hidden rounded-lg border border-tinted bg-paper p-3 shadow-sm sm:w-32">
        {cover ? (
          link ? (
            <a
              href={link}
              target={link.startsWith('http') ? '_blank' : undefined}
              rel={link.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="absolute inset-0 block"
              aria-label={`Open ${title}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cover}
                alt={`${title} cover`}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 hover:scale-105"
              />
            </a>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt={`${title} cover`}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )
        ) : (
          <>
            <span
              aria-hidden
              className="absolute bottom-0 left-0 top-0 w-2 border-r border-tinted/60 bg-cream/70"
            />
            <div className="pl-1">
              <span className="font-serif text-xs italic leading-tight text-ink line-clamp-3">
                {title}
              </span>
            </div>
            <div className="border-t border-tinted/40 pl-1 pt-1.5 text-[10px] text-ink-soft truncate">
              {author}
            </div>
          </>
        )}
      </div>

      {/* Book Metadata */}
      <div className="flex min-w-0 flex-1 flex-col justify-center text-left">
        <h4 className="font-serif text-lg font-normal leading-snug text-ink md:text-xl">
          {link ? (
            <a
              href={link}
              target={link.startsWith('http') ? '_blank' : undefined}
              rel={link.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="transition-colors hover:text-accent"
            >
              {title}
            </a>
          ) : (
            title
          )}
        </h4>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-soft">
          <span>{author}</span>
        </div>
        <div className="my-2.5 h-0.5 w-10 bg-tinted" aria-hidden />
        <p className="text-sm leading-relaxed text-ink-soft">{description}</p>
      </div>
    </div>
  );
}