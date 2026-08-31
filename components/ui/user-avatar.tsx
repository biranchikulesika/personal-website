'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface UserAvatarProps {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
  priority?: boolean;
}

export function UserAvatar({
  src,
  name,
  size = 40,
  className = '',
  priority = false,
}: UserAvatarProps) {
  const defaultFallback = '/biranchi.webp';
  const initialSrc = src && src.trim().length > 0 ? src : defaultFallback;
  const [currentSrc, setCurrentSrc] = useState<string>(initialSrc);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const next = src && src.trim().length > 0 ? src : defaultFallback;
    setCurrentSrc(next);
    setHasError(false);
  }, [src]);

  const initials = (name || 'Admin')
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'A';

  function handleError() {
    if (currentSrc !== defaultFallback) {
      setCurrentSrc(defaultFallback);
    } else {
      setHasError(true);
    }
  }

  if (hasError) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-paper select-none ${className}`}
        style={{ width: size, height: size }}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full border border-tinted/30 bg-post-card shadow-xs ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={currentSrc}
        alt={name}
        fill
        sizes={`${size}px`}
        priority={priority}
        className="object-cover"
        unoptimized
        onError={handleError}
      />
    </div>
  );
}
