'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { NewsletterConfig } from '@/lib/types';
import { NewsletterForm } from './newsletter-form';

const DISMISSED_KEY = 'newsletter-popup-dismissed-at';
const SHOW_AFTER_MS = 28_000;
const HIDE_FOR_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Newsletter invitation shown once a visitor has spent time on the site.
 * Dismissal and successful subscription are remembered for a week.
 */
export function NewsletterPopup({ newsletter }: { newsletter: NewsletterConfig }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Keep the invitation off the support page, where its own checkout dialog
  // would otherwise be covered.
  const isSuppressed = pathname.startsWith('/support');

  const dismiss = useCallback(() => {
    setIsOpen(false);
    try {
      window.localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {
      // Storage can be unavailable (private mode); just close for this visit.
    }
  }, []);

  useEffect(() => {
    if (isSuppressed) {
      setIsOpen(false);
      return;
    }
    try {
      const dismissedAt = Number(window.localStorage.getItem(DISMISSED_KEY));
      if (dismissedAt && Date.now() - dismissedAt < HIDE_FOR_MS) return;
    } catch {
      // Ignore storage errors and still show the invitation.
    }
    const timer = window.setTimeout(() => setIsOpen(true), SHOW_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [isSuppressed]);

  useEffect(() => {
    if (!isOpen) return;
    closeBtnRef.current?.focus();
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') dismiss();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, dismiss]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-4 backdrop-blur-xs animate-in fade-in duration-200 sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) dismiss();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="newsletter-popup-title"
        aria-describedby="newsletter-popup-note"
        className="relative w-full max-w-md rounded-3xl border border-tinted/20 bg-night p-6 text-paper shadow-2xl animate-in zoom-in-95 duration-200 sm:p-8"
      >
        <button
          ref={closeBtnRef}
          type="button"
          onClick={dismiss}
          aria-label="Close newsletter invitation"
          className="absolute right-4 top-4 rounded-full p-2 text-gray-mid transition-colors hover:bg-night-soft hover:text-paper"
        >
          ✕
        </button>

        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
          Newsletter
        </p>
        <h2
          id="newsletter-popup-title"
          className="mt-3 max-w-sm font-serif text-2xl font-normal leading-tight text-paper sm:text-3xl"
        >
          Get the Scribble in your inbox
        </h2>
        <p
          id="newsletter-popup-note"
          className="mt-3 text-sm leading-relaxed text-gray-mid"
        >
          {newsletter.note}
        </p>

        <div className="mt-6">
          <NewsletterForm
            newsletter={newsletter}
            showNote={false}
            onSuccess={dismiss}
          />
        </div>

        <button
          type="button"
          onClick={dismiss}
          className="mt-4 text-xs text-ink-soft transition-colors hover:text-paper"
        >
          No thanks
        </button>
      </div>
    </div>
  );
}
