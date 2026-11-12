'use client';

import { useState } from 'react';
import type { NewsletterConfig } from '@/lib/types';
import { subscribeToNewsletterAction } from '@/app/admin/actions';
import { toast } from '@/lib/toast';

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
  onSuccess?: () => void;
}

export function NewsletterForm({
  newsletter,
  showNote = true,
  onSuccess,
}: NewsletterFormProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || status === 'loading') return;

    setStatus('loading');

    try {
      const res = await subscribeToNewsletterAction({ email });
      if (res.success) {
        setStatus('success');
        const msg = res.message || "Your subscription was successful. Thank you!";
        setEmail('');
        toast.success(msg);
        onSuccess?.();
      } else {
        setStatus('error');
        const err = res.error || 'Unable to subscribe. Please try again.';
        toast.error(err);
      }
    } catch {
      setStatus('error');
      const err = 'Something went wrong. Please check your connection.';
      toast.error(err);
    }
  }

  return (
    <div className="max-w-xl">
      {/* Mobile layout: stacked pill input and button */}
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
          className="w-full rounded-full bg-accent px-6 py-3.5 text-base font-semibold text-night shadow-sm transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-80"
        >
          {status === 'loading'
            ? 'Subscribing…'
            : status === 'success'
              ? 'Subscribed!'
              : newsletter.button}
        </button>
      </form>

      {/* Desktop layout: compact combined pill */}
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
          className="w-full whitespace-nowrap rounded-full bg-accent px-6 py-3 text-base font-semibold text-night transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-80 sm:w-auto"
        >
          {status === 'loading'
            ? 'Subscribing…'
            : status === 'success'
              ? 'Subscribed!'
              : newsletter.button}
        </button>
      </form>

      {showNote && (
        <p className="mt-2.5 px-1 text-xs sm:text-[13px] leading-relaxed text-gray-mid">
          {newsletter.note}
        </p>
      )}
    </div>
  );
}