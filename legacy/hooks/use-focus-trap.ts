/**
 * useFocusTrap — Traps keyboard focus within a container element.
 *
 * Features:
 * - Traps Tab and Shift+Tab to cycle through focusable elements
 * - Focuses the first focusable element when the trap activates
 * - Restores focus to the previously active element when the trap deactivates
 * - Handles dynamic content (new elements appearing within the trap)
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';

/** CSS selector for all focusable elements */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled]):not([aria-hidden="true"])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"]):not([aria-hidden="true"])',
  '[contenteditable="true"]',
].join(', ');

interface UseFocusTrapOptions {
  /** Whether the focus trap is active */
  active: boolean;
  /** Whether to auto-focus the first focusable element on activation (default: true) */
  autoFocus?: boolean;
  /** Callback when the user presses Escape */
  onEscape?: () => void;
}

export function useFocusTrap<T extends HTMLElement>(options: UseFocusTrapOptions) {
  const { active, autoFocus = true, onEscape } = options;
  const containerRef = useRef<T | null>(null);
  const previousActiveElement = useRef<Element | null>(null);

  /** Get all focusable elements within the container */
  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    );
  }, []);

  /** Focus the first focusable element inside the container */
  const focusFirst = useCallback(() => {
    const focusable = getFocusableElements();
    if (focusable.length > 0) {
      focusable[0].focus();
    } else {
      // If no focusable elements, focus the container itself to trap focus
      containerRef.current?.focus();
    }
  }, [getFocusableElements]);

  /** Focus the last focusable element inside the container */
  const focusLast = useCallback(() => {
    const focusable = getFocusableElements();
    if (focusable.length > 0) {
      focusable[focusable.length - 1].focus();
    } else {
      containerRef.current?.focus();
    }
  }, [getFocusableElements]);

  // Activate / deactivate trap
  useEffect(() => {
    if (!active) return;

    // Store the previously focused element so we can restore focus later
    previousActiveElement.current = document.activeElement;

    // Auto-focus first element
    if (autoFocus) {
      // Small delay to ensure the DOM is ready (useful for animated modals)
      const frame = requestAnimationFrame(() => focusFirst());
      return () => cancelAnimationFrame(frame);
    }

    return () => {
      // Restore focus to the element that was focused before the trap opened
      if (previousActiveElement.current && 'focus' in previousActiveElement.current) {
        (previousActiveElement.current as HTMLElement).focus();
      }
    };
  }, [active, autoFocus, focusFirst]);

  // Handle Tab key cycling
  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape
      if (e.key === 'Escape' && onEscape) {
        e.preventDefault();
        onEscape();
        return;
      }

      // Tab / Shift+Tab cycling
      if (e.key !== 'Tab') return;

      const focusable = getFocusableElements();
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement;

      if (e.shiftKey) {
        // Shift+Tab on first element → wrap to last
        if (current === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab on last element → wrap to first
        if (current === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    // Use capture phase to intercept before other handlers
    document.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [active, getFocusableElements, onEscape]);

  return {
    /** Spread this on the container element that should trap focus */
    containerRef,
  };
}
