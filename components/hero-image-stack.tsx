'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import type { HeroImage } from '@/lib/types';

const LAYERS = [
  { x: 0, y: 0, rotate: 0, scale: 1 },
  { x: -20, y: 12, rotate: -7, scale: 0.94 },
  { x: 20, y: 20, rotate: 6, scale: 0.88 },
];

interface HeroImageStackProps {
  images: HeroImage[];
}

/**
 * Fanned portrait deck: the front photo is upright, the rest peek out at
 * angles, and every few seconds the front card drops back while the next
 * one comes forward. Hover pauses the rotation.
 */
export function HeroImageStack({ images }: HeroImageStackProps) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (images.length < 2 || paused) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const id = window.setInterval(() => {
      setActive((current) => (current + 1) % images.length);
    }, 4200);
    return () => window.clearInterval(id);
  }, [images.length, paused]);

  return (
    <div
      role="group"
      aria-label="Portrait gallery"
      className="relative z-10 aspect-[4/5] w-full max-w-[380px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {images.map((image, index) => {
        const position = (index - active + images.length) % images.length;
        const layer = LAYERS[Math.min(position, LAYERS.length - 1)];
        return (
          <div
            key={`${image.src}-${index}`}
            aria-hidden={position !== 0}
            className="absolute inset-0 overflow-hidden rounded-2xl shadow-2xl ring-1 ring-tinted/20 transition-all duration-700 ease-out"
            style={{
              zIndex: images.length - position,
              opacity: position > LAYERS.length - 1 ? 0 : 1,
              transform: `translate(${layer.x}px, ${layer.y}px) rotate(${layer.rotate}deg) scale(${layer.scale})`,
            }}
          >
            <Image
              src={image.src}
              alt={position === 0 ? image.alt : ''}
              fill
              loading={index === 0 ? 'eager' : 'lazy'}
              fetchPriority={index === 0 ? 'high' : 'auto'}
              sizes="(min-width: 1024px) 380px, 100vw"
              className="object-cover object-[center_60%] brightness-105"
            />
          </div>
        );
      })}
    </div>
  );
}
