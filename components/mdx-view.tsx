'use client';

import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import { evaluateBestEffort } from '@/lib/mdx';

/**
 * Client-side MDX renderer used by the editor live previews. Uses the same
 * `evaluateMdx` / components map as the server renderer so the preview matches
 * the public pages exactly.
 */
export function MDXView({
  src,
  intro = false,
  className = '',
}: {
  src: string;
  intro?: boolean;
  className?: string;
}) {
  const [components, setComponents] = useState<ComponentType[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setComponents([]);
    setFailed(false);
    if (!src || !src.trim()) return;

    evaluateBestEffort(src)
      .then((comps) => {
        if (!alive) return;
        setComponents(comps);
        setFailed(comps.length === 0);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });

    return () => {
      alive = false;
    };
  }, [src]);

  if (!src || !src.trim()) return null;
  if (failed) {
    return (
      <p className="text-sm italic text-ink-soft">
        MDX could not be parsed — check your syntax and try again.
      </p>
    );
  }
  if (components.length === 0) return null;

  return (
    <div
      className={`mdx-body ${intro ? 'mdx-intro' : ''} space-y-6 ${className}`}
    >
      {components.map((Content, i) => (
        <Content key={i} />
      ))}
    </div>
  );
}