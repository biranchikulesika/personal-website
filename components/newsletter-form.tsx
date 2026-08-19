'use client';

import { useState } from 'react';
import type { NewsletterConfig } from '@/lib/types';

/**
 * Mock newsletter signup pill, Kadlac-inspired. No backend is wired up on
 * this branch — submitting just shows a confirmation. Replace with a real
 * form action later.
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
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-2 rounded-2xl bg-paper p-1.5 shadow-sm ring-1 ring-tinted sm:flex-row sm:items-center sm:rounded-full"
      >
        <input
          type="email"
          name="email"
          required
          placeholder={newsletter.placeholder}
          aria-label="Email address"
          className="flex-1 rounded-full bg-transparent px-5 py-3 text-base text-ink placeholder:text-ink-soft/50 focus:outline-none"
        />
        <button
          type="submit"
          className="whitespace-nowrap rounded-full bg-ink px-5 py-3 text-base font-semibold text-cream transition-colors hover:bg-accent"
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