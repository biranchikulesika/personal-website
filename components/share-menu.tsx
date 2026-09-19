'use client';

import { useState, useEffect, useRef } from 'react';
import {
  WhatsAppIcon,
  LinkedInIcon,
  TwitterIcon,
  ShareIcon,
  CheckIcon,
  LinkIcon,
  RedditIcon,
  TelegramIcon,
  MailIcon,
} from './icons';

interface ShareMenuProps {
  title: string;
  description?: string;
}

export function ShareMenu({ title, description }: ShareMenuProps) {
  const [url, setUrl] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasNativeShare, setHasNativeShare] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUrl(window.location.href);
    setHasNativeShare(typeof navigator !== 'undefined' && !!navigator.share);
  }, []);

  // Close popover when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const shareUrl = url || '';
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedDesc = encodeURIComponent(description || title);

  const twitterHref = `https://x.com/intent/post?text=${encodedTitle}&url=${encodedUrl}`;
  const linkedinHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
  const whatsappHref = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    title ? `${title} ${shareUrl}` : shareUrl,
  )}`;
  const redditHref = `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`;
  const telegramHref = `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`;
  const mailHref = `mailto:?subject=${encodedTitle}&body=${encodedDesc}%0A%0A${encodedUrl}`;

  const handleCopy = async () => {
    const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(currentUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Clipboard access denied
      }
    }
  };

  const handleShareClick = async () => {
    const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title,
          text: description || title,
          url: currentUrl,
        });
        setIsOpen(false);
        return;
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          // User dismissed device share sheet
          return;
        }
        // Fallback to dropdown menu on share failure
        setIsOpen((prev) => !prev);
      }
    } else {
      setIsOpen((prev) => !prev);
    }
  };

  const handleNativeShare = async () => {
    const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title,
          text: description || title,
          url: currentUrl,
        });
        setIsOpen(false);
      } catch {
        // User cancelled or share error
      }
    }
  };

  return (
    <div ref={menuRef} className="relative inline-flex shrink-0 items-center">
      {/* Horizontal Bar: X, LinkedIn, WhatsApp, Divider, More Share */}
      <div className="inline-flex shrink-0 items-center gap-1 sm:gap-0.5">
        <a
          href={twitterHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on X"
          title="Share on X"
          className="inline-flex h-7 w-7 sm:h-6 sm:w-6 items-center justify-center rounded-full text-ink-soft transition-all duration-200 hover:bg-tinted/40 hover:text-paper"
        >
          <TwitterIcon className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
        </a>

        <a
          href={linkedinHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on LinkedIn"
          title="Share on LinkedIn"
          className="inline-flex h-7 w-7 sm:h-6 sm:w-6 items-center justify-center rounded-full text-ink-soft transition-all duration-200 hover:bg-tinted/40 hover:text-paper"
        >
          <LinkedInIcon className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
        </a>

        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on WhatsApp"
          title="Share on WhatsApp"
          className="inline-flex h-7 w-7 sm:h-6 sm:w-6 items-center justify-center rounded-full text-ink-soft transition-all duration-200 hover:bg-tinted/40 hover:text-paper"
        >
          <WhatsAppIcon className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
        </a>

        <div className="h-3.5 sm:h-3 w-[1px] bg-tinted/40 mx-0.5" aria-hidden="true" />

        <button
          type="button"
          onClick={handleShareClick}
          aria-expanded={isOpen}
          aria-haspopup="true"
          aria-label={hasNativeShare ? 'Share via device' : 'More share options'}
          title={hasNativeShare ? 'Share via device' : 'More share options'}
          className={`inline-flex h-7 w-7 sm:h-6 sm:w-6 items-center justify-center rounded-full transition-all duration-200 ${
            isOpen
              ? 'bg-tinted/60 text-paper'
              : 'text-ink-soft hover:bg-tinted/40 hover:text-paper'
          }`}
        >
          <ShareIcon className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
        </button>
      </div>

      {/* Share Popover Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-label="Share options"
          className="absolute right-0 top-full mt-2 z-50 min-w-[185px] origin-top-right rounded-lg border border-tinted/40 bg-night-soft/95 p-1.5 shadow-2xl backdrop-blur-md text-xs font-sans animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-2 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-ink-soft">
            Share via
          </div>

          <a
            href={redditHref}
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-ink-soft transition-colors hover:bg-tinted/30 hover:text-paper"
          >
            <RedditIcon className="h-3.5 w-3.5 shrink-0 text-[#FF4500]" />
            <span>Reddit</span>
          </a>

          <a
            href={telegramHref}
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-ink-soft transition-colors hover:bg-tinted/30 hover:text-paper"
          >
            <TelegramIcon className="h-3.5 w-3.5 shrink-0 text-[#24A1DE]" />
            <span>Telegram</span>
          </a>

          <a
            href={mailHref}
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-ink-soft transition-colors hover:bg-tinted/30 hover:text-paper"
          >
            <MailIcon className="h-3.5 w-3.5 shrink-0 text-ink-soft" />
            <span>Email</span>
          </a>

          {hasNativeShare && (
            <button
              type="button"
              role="menuitem"
              onClick={handleNativeShare}
              className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-ink-soft transition-colors hover:bg-tinted/30 hover:text-paper"
            >
              <ShareIcon className="h-3.5 w-3.5 shrink-0 text-accent" />
              <span>System Share...</span>
            </button>
          )}

          <div className="my-1 border-t border-tinted/30" />

          <button
            type="button"
            role="menuitem"
            onClick={handleCopy}
            className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-ink-soft transition-colors hover:bg-tinted/30 hover:text-paper"
          >
            <span className="flex items-center gap-2.5">
              <LinkIcon className="h-3.5 w-3.5 shrink-0" />
              <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
            </span>
            {copied && <CheckIcon className="h-3.5 w-3.5 text-accent animate-in fade-in duration-150" />}
          </button>
        </div>
      )}
    </div>
  );
}
