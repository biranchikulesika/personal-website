import { Metadata } from 'next';
import { ThemeToggle } from '@/components/theme-toggle';
import { PersonaSwitcher } from '@/components/persona-switcher';
import { PersonaSearch } from '@/components/persona-search';
import { DesktopNav, MobileNav } from '@/components/nav-links';
import { FooterThinker } from '@/components/footer-thinker';
import { SITE_URL, SITE_NAME, AUTHOR, getCanonicalUrl } from '@/lib/config/seo';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Inside The Head",
    template: "%s | Inside The Head"
  },
  description: "Thoughts, essays, and intellectual explorations by Biranchi Kulesika.",
  authors: [{ name: AUTHOR.name, url: AUTHOR.url }],
  creator: AUTHOR.name,
  publisher: AUTHOR.name,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: SITE_NAME,
    url: getCanonicalUrl('/thinker', 'thinker'),
    description: "Thoughts, essays, and intellectual explorations by Biranchi Kulesika.",
    images: [
      {
        url: '/images/og-fallback-thinker.png',
        width: 1200,
        height: 630,
        alt: 'Thinker — Inside The Head',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    creator: AUTHOR.twitter,
    site: AUTHOR.twitter,
  },
  alternates: {
    canonical: getCanonicalUrl('/thinker', 'thinker'),
    languages: {
      en: getCanonicalUrl('/thinker', 'thinker'),
    },
  },
};

import { Lora } from 'next/font/google';

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-lora',
});

export default function ThinkerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${lora.variable} font-persona theme-thinker bg-background text-foreground min-h-screen selection:bg-primary/20 flex flex-col leading-[1.9] relative z-0`}>
      <div className="pointer-events-none fixed inset-0 z-[-1] dark:bg-[radial-gradient(circle_at_50%_0%,rgba(23,27,32,0.5)_0%,transparent_75%)] bg-[radial-gradient(circle_at_50%_0%,rgba(0,0,0,0.02)_0%,transparent_75%)]" />
      <header className="sticky top-0 z-50 w-full p-4 md:px-6 md:py-4 flex justify-between items-center bg-background/70 backdrop-blur-xl border-b border-border transition-colors duration-1000">
        <PersonaSwitcher currentPersona="Thinker" currentStyle="text-foreground font-sans font-light tracking-wide opacity-60 hover:opacity-100 transition-all duration-700" />
        <div className="flex items-center gap-1 md:gap-2 text-primary">
          <DesktopNav persona="thinker" />
          <PersonaSearch persona="Thinker" mobileBgColor="bg-muted" />
          <ThemeToggle />
          <MobileNav persona="thinker" mobileBgColor="bg-muted" />
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
      <FooterThinker />
    </div>
  );
}
