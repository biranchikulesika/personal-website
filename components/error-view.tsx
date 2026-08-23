'use client';

import { useEffect, useState } from 'react';
import { RefreshIcon, CopyIcon, CheckIcon } from './icons';

export function ErrorView({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [retrying, setRetrying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const isDev = process.env.NODE_ENV === 'development';

  useEffect(() => {
    if (isDev) {
      console.error('Application Error:', error);
    }
  }, [error, isDev]);

  function handleRetry() {
    if (retrying) return;
    setRetrying(true);
    reset();
    setTimeout(() => setRetrying(false), 1000);
  }

  async function handleCopy() {
    const text = [
      error.message ? `Error: ${error.message}` : '',
      error.digest ? `Digest: ${error.digest}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    if (!text) return;

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard error
    }
  }

  const hasDetails = Boolean(error?.message || error?.digest);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-20 text-center">
      <h1 className="font-serif text-2xl font-normal tracking-tight text-paper sm:text-3xl">
        Something went wrong
      </h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-mid">
        We couldn’t load this page. This is usually temporary.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="inline-flex items-center rounded-full border border-tinted/30 bg-night-soft px-5 py-2 text-xs font-semibold text-paper transition-colors hover:bg-post-card"
        >
          Go back
        </button>

        <button
          type="button"
          onClick={handleRetry}
          disabled={retrying}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-xs font-semibold text-paper shadow-sm transition-all hover:bg-accent-hover disabled:opacity-50"
        >
          <RefreshIcon
            className={`h-3.5 w-3.5 ${retrying ? 'animate-spin' : ''}`}
          />
          <span>{retrying ? 'Retrying…' : 'Try again'}</span>
        </button>
      </div>

      {hasDetails && (
        <div className="mt-8 flex w-full max-w-md flex-col items-center">
          <button
            type="button"
            onClick={() => setShowDetails((prev) => !prev)}
            aria-expanded={showDetails}
            className="inline-flex items-center justify-center text-xs font-medium text-gray-secondary transition-colors hover:text-paper focus-visible:outline-none select-none"
          >
            <span className="underline decoration-tinted/40 underline-offset-4">
              {showDetails ? 'Hide technical details' : 'Show technical details'}
            </span>
          </button>

          {showDetails && (
            <div className="mt-3 w-full rounded-xl border border-tinted/20 bg-night-soft p-3.5 text-left font-mono text-xs text-ink-soft shadow-sm">
              <div className="mb-2 flex items-center justify-between border-b border-tinted/10 pb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-mid">
                  Technical details
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium text-gray-secondary transition-colors hover:bg-post-card hover:text-paper"
                  aria-label="Copy error details"
                >
                  {copied ? (
                    <>
                      <CheckIcon className="h-3 w-3 text-accent" />
                      <span className="text-accent">Copied</span>
                    </>
                  ) : (
                    <>
                      <CopyIcon className="h-3 w-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {error.message && (
                <p className="break-words">
                  {error.message}
                </p>
              )}
              {error.digest && (
                <p className="mt-2 text-[11px] text-gray-secondary">
                  Digest: {error.digest}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
