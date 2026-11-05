import Image from 'next/image';
import type { CSSProperties, JSX, ReactNode } from 'react';
import { cleanCoverImageUrl, isSafeUrl } from '@/lib/utils';

export interface BookProps {
  /** Title of the book */
  title: string;
  /** Author or subtitle of the book */
  author?: string;
  /** Primary cover / accent color (hex code or CSS variable) */
  color?: string;
  /** Text color override for simple cover variant */
  textColor?: string;
  /** Whether to apply realistic paper/leather texture */
  textured?: boolean;
  /** Visual variant: 'simple' (solid cover) or 'stripe' / 'default' (split colored header) */
  variant?: 'simple' | 'stripe' | 'default';
  /** Fixed width in pixels or CSS width (e.g. 196 or "100%") */
  width?: number | string;
  /** Real cover image URL if available */
  cover?: string;
  /** Optional link wrapping the book */
  link?: string;
  /** Priority loading for cover image */
  priority?: boolean;
  /** Custom aspect ratio (defaults to 49/60 for Geist, or 2/3 with cover images) */
  aspectRatio?: string;
  /** Custom illustration node for the stripe/header section */
  illustration?: ReactNode;
  /** Custom wrapper CSS class */
  className?: string;
  /** Whether the book should stretch to fill its grid/flex container */
  fluid?: boolean;
  /** Hover rotation angle (e.g. -10 or "-8deg") */
  hoverRotate?: number | string;
}

function DefaultIllustration({ color }: { color: string }) {
  return (
    <svg
      fill="none"
      height="48"
      viewBox="0 0 36 48"
      width="36"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-sm opacity-90 transition-transform duration-300 group-hover:scale-110"
      aria-hidden="true"
    >
      {/* Sleek abstract geometric mark / delta icon */}
      <path
        clipRule="evenodd"
        fillRule="evenodd"
        d="M18 4L32 30H4L18 4Z"
        fill="currentColor"
        style={{ color: 'rgba(255, 255, 255, 0.9)' }}
      />
      <circle cx="18" cy="38" r="3" fill="currentColor" style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
    </svg>
  );
}

export function Book({
  title,
  author,
  color = '#262522',
  textColor,
  textured = false,
  variant = 'default',
  width,
  cover,
  link,
  priority = false,
  aspectRatio,
  illustration,
  className = '',
  fluid = false,
  hoverRotate,
}: BookProps): JSX.Element {
  const cleanedCover = cover ? cleanCoverImageUrl(cover) : undefined;
  const isCoverLocal = cleanedCover ? cleanedCover.startsWith('/') || cleanedCover.startsWith('blob:') : false;

  const isFluid = fluid || width === '100%';
  const widthNum = typeof width === 'number' ? width : typeof width === 'string' && /^\d+$/.test(width) ? parseInt(width, 10) : undefined;
  const resolvedWidth = widthNum ? `${widthNum}px` : typeof width === 'string' ? width : isFluid ? '100%' : '196px';

  // Default aspect ratio: 2/3 for real cover photos, 49/60 for Geist book cards
  const resolvedAspectRatio = aspectRatio || (cleanedCover ? '2 / 3' : '49 / 60');

  const resolvedTextColor = textColor || '#FAF9F5';

  const customStyle: CSSProperties = {
    ['--book-color' as string]: color,
    ['--book-text-color' as string]: resolvedTextColor,
    ['--aspect-ratio' as string]: resolvedAspectRatio,
    ['--book-width' as string]: widthNum ? `${widthNum}px` : resolvedWidth,
    ...(hoverRotate !== undefined
      ? { ['--hover-rotate' as string]: typeof hoverRotate === 'number' ? `${hoverRotate}deg` : hoverRotate }
      : {}),
    width: resolvedWidth,
  };

  const safeLink = link && isSafeUrl(link) ? link : undefined;

  const content = (
    <div
      className={`geist-book-perspective ${isFluid ? 'geist-book-fluid' : ''} ${className}`}
      style={customStyle}
    >
      <div className="geist-book-rotate group">
        {/* Front Cover */}
        <div className="geist-book-front">
          {cleanedCover ? (
            /* Mode 1: Real Cover Image */
            <div className="relative h-full w-full overflow-hidden">
              <Image
                src={cleanedCover}
                alt={`${title} cover`}
                fill
                sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 220px"
                className="object-cover"
                loading={priority ? undefined : 'lazy'}
                priority={priority}
                unoptimized={isCoverLocal}
              />
            </div>
          ) : variant === 'simple' ? (
            /* Mode 2: Geist Simple Variant (Full solid color cover) */
            <div
              className="relative flex h-full w-full flex-col justify-between p-[8cqw] pl-[13cqw]"
              style={{
                backgroundColor: color,
                color: resolvedTextColor,
              }}
            >
              <div className="flex flex-col gap-2 pt-1">
                <span
                  className="font-serif text-[11cqw] font-normal leading-[1.18] tracking-tight line-clamp-4"
                  style={{
                    color: resolvedTextColor,
                    textShadow: textColor
                      ? undefined
                      : '0 0.025em 0.5px rgba(255, 255, 255, 0.2), -0.02em -0.02em 0.5px rgba(0, 0, 0, 0.25)',
                  }}
                >
                  {title}
                </span>
              </div>

              {author ? (
                <div className="border-t border-white/15 pt-2">
                  <span
                    className="block truncate font-sans text-[6cqw] uppercase tracking-wider opacity-85"
                    style={{ color: resolvedTextColor }}
                  >
                    {author}
                  </span>
                </div>
              ) : (
                <div className="flex justify-end opacity-70">
                  <svg
                    viewBox="0 0 16 16"
                    height="14"
                    width="14"
                    fill="currentColor"
                    aria-hidden="true"
                    style={{ color: resolvedTextColor }}
                  >
                    <path fillRule="evenodd" clipRule="evenodd" d="m8 2 7 12H1z" />
                  </svg>
                </div>
              )}
            </div>
          ) : (
            /* Mode 3: Geist Default / Stripe Variant (Top color illustration block + bottom body) */
            <div className="relative flex h-full w-full flex-col">
              {/* Upper Stripe / Illustration Block */}
              <div
                className="relative flex h-[52%] w-full items-center justify-center overflow-hidden"
                style={{ backgroundColor: color }}
              >
                {illustration || <DefaultIllustration color={color} />}
              </div>

              {/* Lower Body Content */}
              <div className="flex flex-1 flex-col justify-between bg-[#191918] p-[7cqw] pl-[12cqw]">
                <span
                  className="font-serif text-[9.5cqw] font-normal leading-[1.2] tracking-tight text-paper line-clamp-3"
                  style={{ color: resolvedTextColor }}
                >
                  {title}
                </span>

                <div className="flex items-center justify-between border-t border-tinted/25 pt-1.5 text-[5.8cqw] text-ink-soft">
                  <span className="truncate pr-1">{author || 'Vercel'}</span>
                  <svg
                    viewBox="0 0 16 16"
                    height="12"
                    width="12"
                    fill="currentColor"
                    className="shrink-0 opacity-70"
                    aria-hidden="true"
                  >
                    <path fillRule="evenodd" clipRule="evenodd" d="m8 2 7 12H1z" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Realistic Spine Crease / Binding Highlight & Shadow */}
          <div className="geist-book-bind" aria-hidden="true" />

          {/* Paper / Leather Surface Texture */}
          {textured && <div className="geist-book-texture" aria-hidden="true" />}
        </div>

        {/* 3D Physical Pages Edge */}
        <div className="geist-book-pages" aria-hidden="true" />

        {/* 3D Back Cover */}
        <div className="geist-book-back" aria-hidden="true" />
      </div>
    </div>
  );

  if (safeLink) {
    return (
      <a
        href={safeLink}
        target={safeLink.startsWith('http') ? '_blank' : undefined}
        rel={safeLink.startsWith('http') ? 'noopener noreferrer' : undefined}
        className="block no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-label={`Open ${title}`}
      >
        {content}
      </a>
    );
  }

  return content;
}
