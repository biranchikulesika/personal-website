/**
 * Book cover display — shows the real cover image when available,
 * otherwise renders a styled placeholder with the title text.
 *
 * Used in library-section, blog-post recommended reading, and the
 * Scribble index. The library-page uses a more elaborate variant with
 * a spine accent and link wrapper, so it keeps its own version.
 */
export function BookCover({
  title,
  cover,
}: {
  title: string;
  cover?: string;
}) {
  if (cover) {
    return (
      <div className="aspect-[2/3] overflow-hidden rounded-lg shadow-sm ring-1 ring-tinted/20 transition-all duration-300">
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
    <div className="flex aspect-[2/3] items-center justify-center overflow-hidden rounded-lg bg-night-soft p-3 shadow-sm ring-1 ring-tinted/20 transition-all duration-300">
      <span className="text-center font-serif text-lg italic leading-snug text-paper/50">
        {title}
      </span>
    </div>
  );
}
