import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
  },
};

export default function BuilderNotFound() {
  return (
    <div className="py-24 md:py-32 flex items-center justify-center">
      <div className="w-full max-w-2xl text-center space-y-6">
        <h1 className="font-sans text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">page not found</h1>
        <div className="space-y-2 opacity-80 font-sans text-sm md:text-base text-foreground/90 font-light">
          <p>The requested blueprint could not be located in the current schematic.</p>
          <p>We are missing the cornerstone for this specific structure.</p>
          <p>Please review the architecture and verify the building blocks.</p>
        </div>
        <div className="pt-8">
          <Link href="/" className="inline-block px-6 py-2 transition-colors border font-mono border-border text-foreground hover:bg-muted bg-background text-[10px] uppercase tracking-widest">
            return to workbench
          </Link>
        </div>
      </div>
    </div>
  );
}
