import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function WandererNotFound() {
  return (
    <div className="py-24 md:py-32 flex items-center justify-center">
      <div className="w-full max-w-2xl text-center space-y-6">
        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl tracking-tight text-foreground">page not found</h1>
        <div className="space-y-2 opacity-80 font-serif text-lg md:text-xl text-foreground/80 leading-relaxed font-light">
          <p>You have stepped past the edge of the map.</p>
          <p>This is a path that hasn&apos;t been traveled yet, a sudden fork in the road.</p>
          <p>Take a breath and find your bearings.</p>
        </div>
        <div className="pt-8">
          <Link href="/" className="inline-block transition-colors border font-serif border-border text-foreground hover:bg-muted bg-background text-sm italic rounded-full px-8 py-3">
            return to camp
          </Link>
        </div>
      </div>
    </div>
  );
}
