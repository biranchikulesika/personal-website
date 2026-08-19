import React from 'react';
import Image from 'next/image';

export interface ImageBlockProps {
  src: string;
  alt: string;
  caption?: string;
  location?: string;
  latitude?: string | number;
  longitude?: string | number;
  credit?: string;
  align?: 'left' | 'center' | 'right' | 'full';
}

export function ImageBlock({ src, alt, caption, location, latitude, longitude, credit, align = 'center' }: ImageBlockProps) {
  if (!src) return null;

  // Security: Prevent malicious URL schemes from rendering
  const lowerSrc = src.toLowerCase();
  if (lowerSrc.startsWith('javascript:') || lowerSrc.startsWith('data:') || lowerSrc.startsWith('vbscript:')) {
    return null;
  }

  // Align-specific layout styling classes
  let alignClasses = 'my-8 w-full';
  if (align === 'left') {
    alignClasses = 'my-8 w-full md:w-1/2 md:float-left md:mr-6 clear-left';
  } else if (align === 'right') {
    alignClasses = 'my-8 w-full md:w-1/2 md:float-right md:ml-6 clear-right';
  } else if (align === 'center') {
    alignClasses = 'my-8 max-w-3xl mx-auto w-full';
  } else if (align === 'full') {
    alignClasses = 'my-8 w-full xl:-mx-8 xl:w-[calc(100%+4rem)] max-w-none';
  }

  return (
    <figure className={alignClasses}>
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-neutral-900 border border-neutral-800">
        <Image
          src={src}
          alt={alt || caption || ''}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 800px"
          referrerPolicy="no-referrer"
          unoptimized={src.startsWith('http')}
        />
      </div>
      {(caption || location || credit) && (
        <figcaption className="mt-3 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between text-sm text-neutral-400">
          <div className="flex items-center gap-2">
            {caption && <span className="font-medium text-neutral-300">{caption}</span>}
            {location && (
              <span className="flex items-center gap-1 text-xs text-neutral-500">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                {location}
              </span>
            )}
          </div>
          {credit && (
            <span className="text-xs text-neutral-500 flex items-center gap-1">
               <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path><path d="M12 12v9"></path><path d="m8 17 4 4 4-4"></path></svg>
               {credit}
            </span>
          )}
        </figcaption>
      )}
    </figure>
  );
}
