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

      {isDev && error.message && (
        <div className="mt-8 max-w-md text-left">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-mid">
            Debug message
          </p>
          <p className="mt-1 font-mono text-xs text-gray-mid break-words">
            {error.message}
          </p>
        </div>
      )}
    </div>
  );
}
