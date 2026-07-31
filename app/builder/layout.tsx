import { Metadata } from 'next';
import { ThemeToggle } from '@/components/theme-toggle';
import { PersonaSwitcher } from '@/components/persona-switcher';
import { PersonaSearch } from '@/components/persona-search';
import { DesktopNav, MobileNav } from '@/components/nav-links';
import { FooterBuilder } from '@/components/footer-builder';
import { SITE_URL, SITE_NAME, AUTHOR, getCanonicalUrl } from '@/lib/config/seo';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Builder",
    template: "%s | Builder"
  },
  description: "Building things with code, systems, and open source.",
  authors: [{ name: AUTHOR.name, url: AUTHOR.url }],
  creator: AUTHOR.name,
  publisher: AUTHOR.name,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: SITE_NAME,
    url: getCanonicalUrl('/builder', 'builder'),
    description: "Building things with code, systems, and open source.",
    images: [
      {
        url: '/images/og-fallback-builder.png',
        width: 1200,
        height: 630,
        alt: 'Builder',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    creator: AUTHOR.twitter,
    site: AUTHOR.twitter,
  },
  alternates: {
    canonical: getCanonicalUrl('/builder', 'builder'),
    languages: {
      en: getCanonicalUrl('/builder', 'builder'),
    },
  },
};

import { Cormorant_Garamond } from 'next/font/google';

const cormorant = Cormorant_Garamond({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-cormorant',
  display: 'swap',
});


export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${cormorant.variable} font-persona theme-builder bg-background text-foreground min-h-screen selection:bg-primary/20 flex flex-col`}>
      <header className="sticky top-0 z-50 w-full p-4 md:p-6 flex justify-between items-center border-b border-border bg-background/80 backdrop-blur-md">
        <PersonaSwitcher currentPersona="Builder" currentStyle="text-primary font-mono" />
        <div className="flex items-center gap-1 md:gap-2">
          <DesktopNav persona="builder" />
          <PersonaSearch persona="Builder" mobileBgColor="bg-background" />
          <ThemeToggle />
          <MobileNav persona="builder" mobileBgColor="bg-background" />
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
      <FooterBuilder />
    </div>
  );
}
