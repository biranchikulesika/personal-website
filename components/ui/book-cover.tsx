/**
 * Book cover display — shows the real cover image when available,
 * otherwise renders a styled placeholder with the title text.
 *
 * Used in library-section, blog-post recommended reading, and the
 * Scribble index. The library-page uses a more elaborate variant with
 * a spine accent and link wrapper, so it keeps its own version.
 */
import Image from 'next/image';

export function BookCover({
  title,
  cover,
  priority = false,
}: {
  title: string;
  cover?: string;
  priority?: boolean;
}) {
  if (cover) {
    return (
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg shadow-sm ring-1 ring-tinted/20 transition-all duration-300">
        <Image
          src={cover}
          alt={`${title} cover`}
          fill
          sizes="(max-width: 640px) 42vw, (max-width: 1024px) 25vw, 220px"
          className="object-cover"
          loading={priority ? undefined : 'lazy'}
          priority={priority}
        />
      </div>
    );
  }
  return (
    <div className="flex aspect-[2/3] items-center justify-center overflow-hidden rounded-lg bg-night-soft p-3 shadow-sm ring-1 ring-tinted/20 transition-all duration-300">
      <span className="text-center font-serif text-lg italic leading-snug text-paper/80">
        {title}
      </span>
    </div>
  );
}
