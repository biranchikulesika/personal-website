import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
  },
};

export default function ThinkerNotFound() {
  return (
    <div className="py-24 md:py-32 flex items-center justify-center">
      <div className="w-full max-w-2xl text-center space-y-6">
        <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl text-foreground font-light tracking-tight italic">page not found</h1>
        <div className="space-y-2 opacity-80 font-serif text-base md:text-xl text-foreground/80 leading-relaxed max-w-2xl mx-auto">
          <p>This thought remains unmapped, resting quietly in the margins.</p>
          <p>A missing page from the ledger of ideas.</p>
          <p>Perhaps it is an unspoken premise waiting to be discovered.</p>
        </div>
        <div className="pt-8">
          <Link href="/" className="inline-block px-6 py-2 transition-colors border font-sans uppercase text-[11px] tracking-widest border-transparent text-foreground/50 hover:text-foreground hover:border-border">
            return to index
          </Link>
        </div>
      </div>
    </div>
  );
}
