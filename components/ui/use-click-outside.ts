'use client';

import { useEffect, type RefObject } from 'react';

/**
 * Checks whether an event target or its ancestors reside inside the container.
 *
 * Implements strict defensive guards against Firefox security restrictions:
 * - "Permission denied to access property nodeType"
 * - "Permission denied to access property correspondingUseElement"
 *
 * These occur when events bubble through SVG trees or browser extensions.
 */
function isEventInsideContainer(
  container: HTMLElement | null,
  event: MouseEvent | TouchEvent | PointerEvent,
): boolean {
  if (!container) return false;

  // 1. Try composedPath() first (modern DOM standard)
  try {
    if (typeof event.composedPath === 'function') {
      const path = event.composedPath();
      if (Array.isArray(path)) {
        for (let i = 0; i < path.length; i++) {
          if (path[i] === container) {
            return true;
          }
        }
      }
    }
  } catch {
    // Ignore Xray / ShadowDOM security errors
  }

  // 2. Safe inspection of event.target
  try {
    const target = event.target;
    if (!target) return false;

    // Check if target is a standard DOM element before invoking contains
    if (
      typeof target === 'object' &&
      target !== null &&
      'nodeType' in target &&
      typeof (target as Node).nodeType === 'number'
    ) {
      if (typeof container.contains === 'function') {
        return container.contains(target as Node);
      }
    }
  } catch {
    // If target inspection is blocked by browser security, treat as inside to prevent unexpected triggers
    return true;
  }

  return false;
}

/**
 * Calls `handler` when an interaction occurs outside the given ref.
 */
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  handler: () => void,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return;

    function handlePointerDown(event: PointerEvent) {
      try {
        if (!ref.current) return;
        if (!isEventInsideContainer(ref.current, event)) {
          handler();
        }
      } catch {
        // Guard against any unhandled browser DOM security errors
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        handler();
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [ref, handler, enabled]);
}
