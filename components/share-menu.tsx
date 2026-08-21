'use client';

import { useState, useEffect } from 'react';
import {
  WhatsAppIcon,
  LinkedInIcon,
  TwitterIcon,
  ShareIcon,
  CheckIcon,
} from './icons';

interface ShareMenuProps {
  title: string;
  description?: string;
}

export function ShareMenu({ title, description }: ShareMenuProps) {
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  const shareUrl = url || '';
  const whatsappHref = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    title ? `${title} ${shareUrl}` : shareUrl,
  )}`;
  const linkedinHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    shareUrl,
  )}`;
  const twitterHref = `https://x.com/intent/post?text=${encodeURIComponent(
    title,
  )}&url=${encodeURIComponent(shareUrl)}`;

  const handleGenericShare = async () => {
    const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text: description || title,
          url: currentUrl,
        });
      } catch {
        // Ignore AbortError / cancelled shares
      }
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(currentUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Clipboard access denied
      }
    }
  };

  return (
    <div className="inline-flex shrink-0 items-center gap-1 text-ink-soft">
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on WhatsApp"
        title="Share on WhatsApp"
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-night-soft hover:text-paper"
      >
        <WhatsAppIcon className="h-3.5 w-3.5" />
      </a>

      <a
        href={linkedinHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on LinkedIn"
        title="Share on LinkedIn"
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-night-soft hover:text-paper"
      >
        <LinkedInIcon className="h-3.5 w-3.5" />
      </a>

      <a
        href={twitterHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on X"
        title="Share on X"
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-night-soft hover:text-paper"
      >
        <TwitterIcon className="h-3.5 w-3.5" />
      </a>

      <button
        type="button"
        onClick={handleGenericShare}
        aria-label={copied ? 'Link copied to clipboard' : 'Share'}
        title={copied ? 'Link copied!' : 'Share'}
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-night-soft hover:text-paper"
      >
        {copied ? (
          <CheckIcon className="h-3.5 w-3.5 text-accent" />
        ) : (
          <ShareIcon className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}
