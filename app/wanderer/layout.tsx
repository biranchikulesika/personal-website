import { Metadata } from 'next';
import { ThemeToggle } from '@/components/theme-toggle';
import { PersonaSwitcher } from '@/components/persona-switcher';
import { PersonaSearch } from '@/components/persona-search';
import { DesktopNav, MobileNav } from '@/components/nav-links';
import { FooterWanderer } from '@/components/footer-wanderer';
import { SITE_URL, SITE_NAME, AUTHOR, getCanonicalUrl } from '@/lib/config/seo';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Wanderer",
    template: "%s | Wanderer"
  },
  description: "Stories, places, memories, and things noticed along the way.",
  authors: [{ name: AUTHOR.name, url: AUTHOR.url }],
  creator: AUTHOR.name,
  publisher: AUTHOR.name,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: SITE_NAME,
    url: getCanonicalUrl('/wanderer', 'wanderer'),
    description: "Stories, places, memories, and things noticed along the way.",
    images: [
      {
        url: '/images/og-fallback-wanderer.png',
        width: 1200,
        height: 630,
        alt: 'Wanderer',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    creator: AUTHOR.twitter,
    site: AUTHOR.twitter,
  },
  alternates: {
    canonical: getCanonicalUrl('/wanderer', 'wanderer'),
    languages: {
      en: getCanonicalUrl('/wanderer', 'wanderer'),
    },
  },
};

import { Quicksand } from 'next/font/google';

const quicksand = Quicksand({
  subsets: ['latin'],
  variable: '--font-quicksand',
});

export default function WandererLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${quicksand.variable} font-persona theme-wanderer bg-background text-foreground min-h-screen selection:bg-primary/20 flex flex-col leading-relaxed relative z-0`}>
      <div className="pointer-events-none fixed inset-0 z-[-1] dark:bg-[radial-gradient(ellipse_at_50%_0%,rgba(34,28,24,0.3)_0%,transparent_70%)] bg-[radial-gradient(ellipse_at_50%_0%,rgba(238,231,222,0.8)_0%,transparent_70%)]" />
      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="sticky top-0 z-50 w-full px-6 py-6 transition-colors duration-1000 flex justify-between items-center bg-background/90 backdrop-blur-xl border-b border-border">
          <PersonaSwitcher currentPersona="Wanderer" currentStyle="text-primary hover:text-foreground font-spectral italic opacity-90 hover:opacity-100 transition-colors duration-700" />
          <div className="flex items-center gap-1 md:gap-2 text-primary">
            <DesktopNav persona="wanderer" />
            <PersonaSearch persona="Wanderer" mobileBgColor="bg-muted" />
            <ThemeToggle />
            <MobileNav persona="wanderer" mobileBgColor="bg-muted" />
          </div>
        </header>
        <main className="flex-1">
          {children}
        </main>
        <FooterWanderer />
      </div>
    </div>
  );
}
