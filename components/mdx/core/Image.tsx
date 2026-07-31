'use client';

import { useState } from 'react';
import Image from 'next/image';
import { getPublicUrl } from '@/lib/supabase/storage';

interface MDXImageProps {
  src?: string;
  path?: string; // Supabase storage path
  alt?: string;
  caption?: string;
  location?: string;
  className?: string;
}

export const MDXImage = ({ src, path, alt, caption, location, className }: MDXImageProps) => {
  const [hasError, setHasError] = useState(false);

  // If path is provided, resolve it using Supabase storage. Otherwise use src.
  // getPublicUrl is synchronous and only constructs a URL — no I/O, no auth needed.
  const imageUrl = path ? getPublicUrl({ bucket: 'post-images', path }) : src;

  if (!imageUrl) {
    return (
      <figure className={`my-10 block w-full relative ${className || ''}`}>
        <div className="relative overflow-hidden w-full border border-border bg-muted flex items-center justify-center" style={{ aspectRatio: '16/10' }}>
          <span className="text-[11px] font-mono text-muted-foreground/50 select-none">
            Image missing
          </span>
        </div>
      </figure>
    );
  }

  if (hasError) {
    return (
      <figure className={`my-10 block w-full relative ${className || ''}`}>
        <div className="relative overflow-hidden w-full border border-dashed border-border bg-muted flex items-center justify-center" style={{ aspectRatio: '16/10' }}>
          <span className="text-[11px] font-mono text-muted-foreground/50 select-none">
            Image failed to load
          </span>
        </div>
      </figure>
    );
  }

  // Determine emoji for location if provided
  const getEmojiForLocation = (loc: string): string => {
    const l = loc.toLowerCase();
    if (l.includes('platform') || l.includes('coast') || l.includes('beach') || l.includes('ocean')) return '🌊';
    if (l.includes('train') || l.includes('transit') || l.includes('rail') || l.includes('carriage') || l.includes('district') || l.includes('cuttack')) return '🚃';
    if (l.includes('bhubaneswar') || l.includes('study') || l.includes('lounge') || l.includes('town') || l.includes('puri')) return '📍';
    return '📍';
  };

  return (
    <figure className={`my-10 block w-full relative ${className || ''}`}>
      <div className="relative overflow-hidden w-full border border-border bg-muted" style={{ aspectRatio: '16/10' }}>
        <Image
          src={imageUrl}
          alt={alt || caption || ''}
          fill
          sizes="(max-width: 768px) 100vw, 75vw"
          className="object-cover"
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
          // Bypass Next.js image optimization for all external URLs.
          // User-uploaded images (via Supabase) are already optimized at the
          // CDN level, and re-optimizing them through Next.js can fail for
          // various CORS/response reasons, causing the image not to load.
          unoptimized={imageUrl.startsWith('http')}
        />
        {location && (
          <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1 text-[10.5px] backdrop-blur-[6px] rounded-full select-none font-mono tracking-wide text-foreground bg-muted border border-border">
            <span>{getEmojiForLocation(location)}</span>
            <span>{location}</span>
          </div>
        )}
      </div>
      {caption && (
        <figcaption className="mt-2.5 text-center text-[11px] uppercase max-w-[80%] mx-auto opacity-55 leading-relaxed select-none font-mono tracking-widest text-primary">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};

// Backward-compatible alias for MDXComponents
export { MDXImage as Image };
