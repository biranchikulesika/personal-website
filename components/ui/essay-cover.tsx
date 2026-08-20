/**
 * Cover display for essay/post cards.
 *
 * When a cover image URL is provided, renders the artwork preserving
 * transparency (ideal for transparent WebP files). The card's own
 * solid background remains visible through transparent portions.
 *
 * Falls back to a styled placeholder with the title's first letter.
 *
 * Uses min-height rather than a fixed aspect ratio so cards have a
 * rectangular baseline shape but grow taller when content requires it.
 */
export function EssayCover({
  title,
  coverImage,
}: {
  title: string;
  coverImage?: string;
}) {
  if (coverImage) {
    return (
      <div className="flex min-h-[220px] items-center justify-center overflow-hidden rounded-xl">
        {/* eslint-disable-next-line @next/next/no-img-element -- cover artwork may be transparent WebP served from any origin */}
        <img
          src={coverImage}
          alt={`Cover for ${title}`}
          className="max-h-full w-full object-contain"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-[220px] items-center justify-center overflow-hidden rounded-xl bg-[radial-gradient(ellipse_at_center,rgba(250,249,245,0.08)_15%,transparent_75%)]">
      <span className="font-serif text-5xl italic text-paper/40">
        {title.charAt(0)}
      </span>
    </div>
  );
}
