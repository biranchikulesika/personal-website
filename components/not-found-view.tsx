import Link from 'next/link';

const RECOVERY_ACTIONS = [
  { href: '/', label: 'Home' },
  { href: '/scribble', label: 'Scribble' },
] as const;

export function NotFoundView() {
  return (
    <div className="relative flex min-h-[75vh] items-center justify-center px-4 py-16">
      {/* Soft radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(250,249,245,0.04)_0%,transparent_70%)] opacity-50"
      />

      <div className="relative w-full max-w-xl text-center">
        {/* Large 404 Headline */}
        <h1 className="font-serif text-2xl font-normal tracking-tight text-paper sm:text-3xl">
          <span aria-hidden className="block font-serif text-7xl font-normal leading-none tracking-tight text-paper sm:text-8xl">
            404
          </span>
          <span className="mt-4 block">
            Page Not Found
          </span>
        </h1>

        <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-ink-soft">
          The page you’re looking for doesn’t exist or may have been moved.
        </p>

        {/* Primary Recovery Cards — Home & Scribble */}
        <div className="mx-auto mt-10 grid max-w-sm grid-cols-1 gap-4 sm:grid-cols-2">
          {RECOVERY_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-center justify-center rounded-2xl border border-tinted/20 bg-night-soft py-4 px-6 shadow-sm transition-all hover:border-accent/40 hover:bg-post-card hover:shadow-md"
            >
              <span className="font-serif text-lg font-medium text-paper transition-colors group-hover:text-accent">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
