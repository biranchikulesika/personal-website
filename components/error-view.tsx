'use client';

import { useEffect, useRef, useState, Fragment } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  RefreshIcon,
  AlertCircleIcon,
  CopyIcon,
  CheckIcon,
  ChevronDownIcon,
} from './icons';

const ESCAPE_ROUTES = [
  { label: 'Home', href: '/' },
  { label: 'Scribble', href: '/scribble' },
  { label: 'Library', href: '/library' },
  { label: 'Support', href: '/support' },
  { label: 'About', href: '/about' },
];

export function ErrorView({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [copied, setCopied] = useState<'reference' | 'message' | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDev = process.env.NODE_ENV === 'development';

  useEffect(() => {
    if (isDev) {
      console.error('Application Error:', error);
    }
  }, [error, isDev]);

  useEffect(() => {
    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, []);

  const reference = error.digest ?? null;

  function handleRetry() {
    if (retrying) return;
    setRetrying(true);
    reset();
    retryTimerRef.current = setTimeout(() => setRetrying(false), 1200);
  }

  async function copyText(text: string, key: 'reference' | 'message') {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
      setCopied(key);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      // Clipboard unavailable
    }
  }

  return (
    <div className="relative flex min-h-[70vh] items-center justify-center px-4 py-16">
      {/* Subtle radial background glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--color-tinted)_0%,transparent_70%)] opacity-40"
      />

      <div className="relative w-full max-w-lg text-center">
        {/* Error Badge Icon */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-tinted bg-cream text-accent shadow-xs">
          <AlertCircleIcon className="h-6 w-6" />
        </div>

        {/* Headline */}
        <h1 className="mt-6 font-serif text-3xl font-normal tracking-tight text-ink sm:text-4xl">
          We couldn’t load this page
        </h1>

        <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-ink-soft">
          This is usually temporary. Try refreshing the page, or return to where you were.
        </p>

        {/* Primary Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 rounded-full border border-tinted bg-cream px-5 py-2.5 text-sm font-semibold text-ink shadow-xs transition-colors hover:bg-paper"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Go back</span>
          </button>

          <button
            type="button"
            onClick={handleRetry}
            disabled={retrying}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-cream shadow-sm transition-all hover:bg-accent disabled:opacity-50"
          >
            <RefreshIcon
              className={`h-4 w-4 ${retrying ? 'animate-spin' : ''}`}
            />
            <span>{retrying ? 'Retrying…' : 'Try again'}</span>
          </button>
        </div>

        {/* Technical Details Accordion */}
        {(isDev || reference || error.message) && (
          <div className="mt-10 border-t border-tinted pt-6">
            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              aria-expanded={showDetails}
              className="mx-auto inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-soft transition-colors hover:text-ink"
            >
              <span>{showDetails ? 'Hide technical details' : 'Show technical details'}</span>
              <ChevronDownIcon
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  showDetails ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showDetails && (
              <div className="mt-4 space-y-3 rounded-2xl border border-tinted bg-cream p-4 text-left shadow-xs animate-in fade-in zoom-in-95">
                {reference && (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="block text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                        Error Reference
                      </span>
                      <code className="mt-0.5 block truncate font-mono text-xs text-ink">
                        {reference}
                      </code>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyText(`Error Reference: ${reference}`, 'reference')}
                      className="shrink-0 rounded-lg bg-paper p-1.5 text-ink-soft ring-1 ring-tinted transition-colors hover:text-ink"
                      aria-label="Copy error reference"
                    >
                      {copied === 'reference' ? (
                        <CheckIcon className="h-3.5 w-3.5 text-accent" />
                      ) : (
                        <CopyIcon className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                )}

                {error.message && (
                  <div className="flex items-start justify-between gap-3 border-t border-tinted/60 pt-2.5">
                    <div className="min-w-0">
                      <span className="block text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                        Message
                      </span>
                      <code className="mt-0.5 block break-words font-mono text-xs text-ink-soft">
                        {error.message}
                      </code>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyText(error.message, 'message')}
                      className="shrink-0 rounded-lg bg-paper p-1.5 text-ink-soft ring-1 ring-tinted transition-colors hover:text-ink"
                      aria-label="Copy error message"
                    >
                      {copied === 'message' ? (
                        <CheckIcon className="h-3.5 w-3.5 text-accent" />
                      ) : (
                        <CopyIcon className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Quiet Escape Navigation Routes */}
        <nav aria-label="Popular destinations" className="mt-10">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs">
            {ESCAPE_ROUTES.map((route, idx) => (
              <Fragment key={route.href}>
                {idx > 0 && <span className="text-tinted">•</span>}
                <Link
                  href={route.href}
                  className="font-medium text-ink-soft transition-colors hover:text-ink"
                >
                  {route.label}
                </Link>
              </Fragment>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
