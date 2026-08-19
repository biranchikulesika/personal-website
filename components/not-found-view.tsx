import Link from 'next/link';
import { Fragment } from 'react';

const RECOVERY_ACTIONS = [
  { href: '/', label: 'Home', description: 'Return to the start' },
  { href: '/scribble', label: 'Scribble', description: 'Browse essays & notes' },
  { href: '/library', label: 'Library', description: 'Explore bookshelf' },
] as const;

const POPULAR_DESTINATIONS = [
  { href: '/about', label: 'About' },
  { href: '/now', label: 'Now' },
  { href: '/support', label: 'Support' },
  { href: 'https://github.com/biranchikulesika', label: 'GitHub' },
];

export function NotFoundView() {
  return (
    <div className="relative flex min-h-[75vh] items-center justify-center px-4 py-16">
      {/* Soft radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--color-tinted)_0%,transparent_70%)] opacity-50"
      />

      <div className="relative w-full max-w-xl text-center">
        {/* Large 404 Headline */}
        <h1 className="flex flex-col items-center">
          <span
            aria-hidden
            className="font-serif text-7xl font-normal leading-none tracking-tight text-ink sm:text-8xl"
          >
            404
          </span>
          <span className="mt-4 font-serif text-2xl font-normal tracking-tight text-ink sm:text-3xl">
            Page Not Found
          </span>
        </h1>

        <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-ink-soft">
          The page you’re looking for doesn’t exist or may have been moved.
        </p>

        {/* Primary Recovery Cards */}
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {RECOVERY_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex flex-col items-center justify-center rounded-2xl border border-tinted bg-cream p-5 shadow-xs transition-all hover:border-ink/40 hover:bg-paper hover:shadow-sm"
            >
              <span className="font-serif text-lg font-medium text-ink group-hover:text-accent">
                {action.label}
              </span>
              <span className="mt-1 text-xs text-ink-soft">
                {action.description}
              </span>
            </Link>
          ))}
        </div>

        {/* Quiet Tertiary Escape Routes */}
        <nav aria-label="Other destinations" className="mt-10 border-t border-tinted pt-6">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs">
            {POPULAR_DESTINATIONS.map((dest, idx) => (
              <Fragment key={dest.href}>
                {idx > 0 && <span className="text-tinted">•</span>}
                {dest.href.startsWith('http') ? (
                  <a
                    href={dest.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-ink-soft transition-colors hover:text-ink"
                  >
                    {dest.label}
                  </a>
                ) : (
                  <Link
                    href={dest.href}
                    className="font-medium text-ink-soft transition-colors hover:text-ink"
                  >
                    {dest.label}
                  </Link>
                )}
              </Fragment>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
