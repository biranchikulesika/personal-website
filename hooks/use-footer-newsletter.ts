'use client';

import { useState } from 'react';
import { subscribeNewsletter } from '@/app/actions/public.actions';

type NewsletterStatus = 'idle' | 'submitting' | 'success' | 'error';

export function useFooterNewsletter(persona: string) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<NewsletterStatus>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || status === 'submitting') return;
    setStatus('submitting');
    setMessage('');
    try {
      const result = await subscribeNewsletter(email.trim(), [persona], persona);
      if (result.success) {
        setStatus('success');
        setMessage('Subscribed');
        setEmail('');
        setTimeout(() => setStatus('idle'), 4000);
      } else {
        setStatus('error');
        setMessage(result.error || 'Failed');
      }
    } catch (err) {
      console.error('Newsletter error:', err);
      setStatus('error');
      setMessage('Something went wrong');
    }
  };

  return {
    email,
    setEmail,
    status,
    message,
    handleSubmit,
  };
}
