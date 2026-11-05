import type { NowBook } from '@/lib/types';
import { Book } from '@/components/ui/book';

/**
 * BookBlock: a reusable MDX block component rendered from a `<Book ... />`
 * tag inside markdown content. Used in the editor preview and the public
 * Now page.
 */
export function BookBlock({ title, author, description, cover, link }: NowBook) {
  return (
    <div className="my-8 flex flex-col items-center gap-6 rounded-2xl border border-tinted/20 bg-night-soft p-5 shadow-md transition-all duration-300 hover:shadow-lg sm:flex-row sm:items-start md:p-6">
      {/* 3D Physical Book Cover */}
      <div className="shrink-0 w-28 sm:w-32">
        <Book
          title={title}
          author={author}
          cover={cover}
          link={link}
          width="100%"
          textured
        />
      </div>

      {/* Book Metadata */}
      <div className="flex min-w-0 flex-1 flex-col justify-center text-left">
        <h4 className="font-serif text-lg font-normal leading-snug text-paper md:text-xl">
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
        <div className="my-2.5 h-0.5 w-10 bg-tinted/20" aria-hidden />
        <p className="text-sm leading-relaxed text-ink-soft">{description}</p>
      </div>
    </div>
  );
}