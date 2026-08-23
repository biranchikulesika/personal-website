'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

export interface GalleryImage {
  src: string;
  alt: string;
  caption?: string;
}

interface LandscapeGalleryProps {
  images?: GalleryImage[];
  priority?: boolean;
}

export function LandscapeGallery({
  images = [],
  priority = false,
}: LandscapeGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const hasImages = images.length > 0;
  const currentImage = hasImages ? images[currentIndex] : null;

  const handlePrev = () => {
    if (!hasImages) return;
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    if (!hasImages) return;
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <figure
      className="group relative aspect-[1.65/1] w-full overflow-hidden rounded-2xl bg-night-soft shadow-2xl ring-1 ring-tinted/20 transition-all duration-300 hover:shadow-xl"
      aria-label="Landscape photo gallery"
    >
      {currentImage ? (
        <>
          <Image
            src={currentImage.src}
            alt={currentImage.alt}
            fill
            sizes="(min-width: 1024px) 600px, 90vw"
            className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
            priority={priority && currentIndex === 0}
          />

          {currentImage.caption && (
            <figcaption className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-ink/90 via-ink/40 to-transparent p-4 pt-8 text-xs text-paper/90 backdrop-blur-[2px]">
              {currentImage.caption}
            </figcaption>
          )}

          {images.length > 1 && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous photo"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-night-soft/90 text-paper shadow-md backdrop-blur transition-transform hover:scale-110"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next photo"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-night-soft/90 text-paper shadow-md backdrop-blur transition-transform hover:scale-110"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          )}

          {images.length > 1 && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentIndex ? 'w-4 bg-paper' : 'w-1.5 bg-paper/50'
                  }`}
                  aria-hidden
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-post-card/80 ring-1 ring-tinted/20">
            <span className="font-serif text-lg italic text-ink-soft/60">✦</span>
          </div>
          <p className="mt-3 font-serif text-base italic text-ink-soft">
            Visual journal & atmosphere
          </p>
          <span className="mt-1 text-xs text-ink-soft/60">
            Landscape gallery frame
          </span>
        </div>
      )}
    </figure>
  );
}
