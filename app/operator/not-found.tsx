import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function OperatorNotFound() {
  return (
    <div className="py-24 md:py-32 flex items-center justify-center">
      <div className="w-full max-w-2xl text-center space-y-6">
        <h1 className="font-mono text-xl md:text-2xl text-primary font-bold tracking-widest uppercase">page not found</h1>
        <div className="space-y-2 opacity-80 font-mono text-[10px] md:text-xs text-primary/80 uppercase tracking-widest leading-relaxed">
          <p>Exception: Invalid command path execution failure.</p>
          <p>The target system directory is missing or inaccessible.</p>
          <p>Please re-initialize terminal sequence.</p>
        </div>
        <div className="pt-8">
          <Link href="/" className="inline-block px-6 py-2 transition-colors border font-mono border-primary text-primary hover:bg-primary/20 bg-background text-[10px] uppercase">
            return to console
          </Link>
        </div>
      </div>
    </div>
  );
}
