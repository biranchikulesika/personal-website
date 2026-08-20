'use client';

import { useState } from 'react';
import type { NewsletterConfig } from '@/lib/types';

/**
 * Mock newsletter signup. No backend is wired up on this branch — submitting
 * just shows a confirmation. Replace with a real form action later.
 *
 * Mobile and desktop get deliberately different treatments: a full-width
 * underline-input card on small screens, the compact Kadlac-style pill on
 * desktop. They share the same state and submit handler.
 */
interface NewsletterFormProps {
  newsletter: NewsletterConfig;
  showNote?: boolean;
}

export function NewsletterForm({
  newsletter,
  showNote = true,
}: NewsletterFormProps) {
  const [subscribed, setSubscribed] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubscribed(true);
  }

  return (
    <div className="max-w-xl">
      {/* Mobile layout — underline input + full-width button */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl bg-night-soft p-4 shadow-lg ring-1 ring-tinted/20 sm:hidden"
      >
        <input
          type="email"
          name="email"
          required
          placeholder={newsletter.placeholder}
          aria-label="Email address"
          className="w-full border-b border-tinted/20 bg-transparent pb-2 text-base text-paper placeholder:text-ink-soft/60 focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          className="mt-4 w-full rounded-xl bg-accent px-5 py-3 text-base font-semibold text-paper transition-colors hover:bg-accent-hover"
        >
          {subscribed ? 'Subscribed!' : newsletter.button}
        </button>
      </form>

      {/* Desktop layout — compact pill */}
      <form
        onSubmit={handleSubmit}
        className="hidden flex-col gap-2 rounded-2xl bg-night-soft p-1.5 shadow-lg ring-1 ring-tinted/20 sm:flex sm:flex-row sm:items-center sm:rounded-full"
      >
        <input
          type="email"
          name="email"
          required
          placeholder={newsletter.placeholder}
          aria-label="Email address"
          className="w-full flex-1 rounded-full bg-transparent px-5 py-3 text-base text-paper placeholder:text-ink-soft/60 focus:outline-none"
        />
        <button
          type="submit"
          className="w-full whitespace-nowrap rounded-full bg-accent px-6 py-3 text-base font-semibold text-paper transition-colors hover:bg-accent-hover sm:w-auto"
        >
          {subscribed ? 'Subscribed!' : newsletter.button}
        </button>
      </form>

      {showNote && (
        <p className="mt-3 text-xs font-medium uppercase tracking-wider text-ink-soft/80">
          {newsletter.note}
        </p>
      )}
    </div>
  );
}