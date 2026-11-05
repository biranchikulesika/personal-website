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
import Image from 'next/image';
import { cleanCoverImageUrl } from '@/lib/utils';

export function EssayCover({
  title,
  coverImage,
  priority = false,
}: {
  title: string;
  coverImage?: string;
  priority?: boolean;
}) {
  const cleanSrc = cleanCoverImageUrl(coverImage);
  if (cleanSrc) {
    return (
      <div className="relative flex h-[220px] w-full items-center justify-center overflow-hidden rounded-xl">
        <Image
          src={cleanSrc}
          alt={`Cover for ${title}`}
          fill
          sizes="(max-width: 640px) 82vw, (max-width: 1024px) 50vw, 400px"
          className="object-contain"
          loading={priority ? undefined : 'lazy'}
          priority={priority}
          unoptimized={
            cleanSrc.startsWith('blob:') ||
            cleanSrc.startsWith('http://127.0.0.1') ||
            cleanSrc.startsWith('http://localhost')
          }
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-[220px] items-center justify-center overflow-hidden rounded-xl bg-[radial-gradient(ellipse_at_center,rgba(250,249,245,0.08)_15%,transparent_75%)]">
      <span className="font-serif text-5xl italic text-paper/70">
        {title.charAt(0)}
      </span>
    </div>
  );
}
