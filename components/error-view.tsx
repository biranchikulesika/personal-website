'use client';

import { useEffect, useState } from 'react';
import { RefreshIcon } from './icons';

export function ErrorView({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [retrying, setRetrying] = useState(false);
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

      {(error.message || error.digest) && (
        <details className="group mt-8 max-w-md text-left">
          <summary className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-gray-secondary transition-colors hover:text-paper focus-visible:outline-none select-none">
            <span className="underline decoration-tinted/40 underline-offset-4 group-open:no-underline">
              Show technical details
            </span>
          </summary>
          <div className="mt-3 rounded-xl border border-tinted/20 bg-night-soft p-3.5 text-left font-mono text-xs text-ink-soft">
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
        </details>
      )}
    </div>
  );
}
