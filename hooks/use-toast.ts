"use client";

import { useCallback, useRef, useState } from "react";

interface UseToastReturn {
  /** The current toast message, or null if no toast is visible. */
  message: string | null;
  /** Show a toast message. Automatically dismisses after the configured duration. */
  showToast: (msg: string) => void;
  /** Immediately dismiss the current toast. */
  dismissToast: () => void;
}

/**
 * Shared toast hook for admin components.
 *
 * Replaces the duplicated showToast pattern found in:
 * - account-manager.tsx
 * - compose-workspace.tsx
 * - book-cover-picker.tsx
 * - content-manager.tsx
 * - media-manager.tsx
 *
 * Renders the toast inline where used — no global context needed.
 */
export function useToast(durationMs = 3500): UseToastReturn {
  const [message, setMessage] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (msg: string) => {
      // Clear any existing timer.
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      setMessage(msg);
      timerRef.current = setTimeout(() => {
        setMessage(null);
        timerRef.current = null;
      }, durationMs);
    },
    [durationMs],
  );

  const dismissToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setMessage(null);
  }, []);

  return { message, showToast, dismissToast };
}
