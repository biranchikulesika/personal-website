import Link from 'next/link';

export function NotFoundView() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-20 text-center">
      <p className="font-serif text-7xl font-normal leading-none tracking-tight text-paper sm:text-8xl">
        404
      </p>
      <h1 className="mt-4 font-serif text-2xl font-normal tracking-tight text-paper sm:text-3xl">
        Page not found
      </h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-mid">
        The page you’re looking for doesn’t exist
        <br />
        or may have been moved.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center rounded-full bg-accent px-5 py-2 text-xs font-semibold text-paper shadow-sm transition-colors hover:bg-accent-hover"
        >
          Home
        </Link>
        <Link
          href="/scribble"
          className="inline-flex items-center rounded-full border border-tinted/30 bg-night-soft px-5 py-2 text-xs font-semibold text-paper transition-colors hover:bg-post-card"
        >
          Scribble
        </Link>
      </div>
    </div>
  );
}
