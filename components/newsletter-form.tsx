'use client';

import { useState } from 'react';
import type { NewsletterConfig } from '@/lib/types';
import { subscribeToNewsletterAction } from '@/app/admin/actions';

/**
 * Newsletter signup form.
 *
 * Mobile and desktop get deliberately different treatments: a full-width
 * stacked pill on small screens, and the compact pill on desktop.
 * Both submit directly to Supabase via server action / API.
 */
interface NewsletterFormProps {
  newsletter: NewsletterConfig;
  showNote?: boolean;
  source?: string;
}

export function NewsletterForm({
  newsletter,
  showNote = true,
  source = 'website',
}: NewsletterFormProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || status === 'loading') return;

    setStatus('loading');
    setMessage('');

    try {
      const res = await subscribeToNewsletterAction({ email, source });
      if (res.success) {
        setStatus('success');
        setMessage(res.message || "You're on the list! Thank you.");
        setEmail('');
      } else {
        setStatus('error');
        setMessage(res.error || 'Unable to subscribe. Please try again.');
      }
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Please check your connection.');
    }
  }

  return (
    <div className="max-w-xl">
      {/* Mobile layout — stacked pill input and button */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 sm:hidden"
      >
        <input
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === 'loading' || status === 'success'}
          required
          placeholder={newsletter.placeholder}
          aria-label="Email address"
          className="w-full rounded-full border border-tinted/20 bg-night-soft px-5 py-3.5 text-base text-paper placeholder:text-ink-soft/60 shadow-sm transition-colors focus:border-tinted/40 focus:outline-none focus:ring-0 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={status === 'loading' || status === 'success'}
          className="w-full rounded-full bg-accent px-6 py-3.5 text-base font-semibold text-paper shadow-sm transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-80"
        >
          {status === 'loading'
            ? 'Subscribing…'
            : status === 'success'
              ? 'Subscribed!'
              : newsletter.button}
        </button>
      </form>

      {/* Desktop layout — compact combined pill */}
      <form
        onSubmit={handleSubmit}
        className="hidden flex-col gap-2 rounded-2xl border border-tinted/20 bg-night-soft p-1.5 shadow-lg transition-colors focus-within:border-tinted/40 sm:flex sm:flex-row sm:items-center sm:rounded-full"
      >
        <input
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === 'loading' || status === 'success'}
          required
          placeholder={newsletter.placeholder}
          aria-label="Email address"
          className="w-full flex-1 rounded-full border-none bg-transparent px-5 py-3 text-base text-paper placeholder:text-ink-soft/60 focus:outline-none focus:ring-0 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={status === 'loading' || status === 'success'}
          className="w-full whitespace-nowrap rounded-full bg-accent px-6 py-3 text-base font-semibold text-paper transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-80 sm:w-auto"
        >
          {status === 'loading'
            ? 'Subscribing…'
            : status === 'success'
              ? 'Subscribed!'
              : newsletter.button}
        </button>
      </form>

      {/* Status Feedback Message */}
      {status === 'success' && (
        <p
          aria-live="polite"
          className="mt-2.5 px-1 text-xs sm:text-[13px] font-medium text-emerald-400"
        >
          {message}
        </p>
      )}

      {status === 'error' && (
        <p
          aria-live="polite"
          className="mt-2.5 px-1 text-xs sm:text-[13px] font-medium text-rose-400"
        >
          {message}
        </p>
      )}

      {status !== 'success' && status !== 'error' && showNote && (
        <p className="mt-2.5 px-1 text-xs sm:text-[13px] leading-relaxed text-gray-mid/75">
          {newsletter.note}
        </p>
      )}
    </div>
  );
}