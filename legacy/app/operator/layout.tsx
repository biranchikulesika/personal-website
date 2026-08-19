import { Metadata } from 'next';
import { ThemeToggle } from '@/components/theme-toggle';
import { PersonaSwitcher } from '@/components/persona-switcher';
import { PersonaSearch } from '@/components/persona-search';
import { DesktopNav, MobileNav } from '@/components/nav-links';
import { FooterOperator } from '@/components/footer-operator';
import { SITE_URL, SITE_NAME, AUTHOR, getCanonicalUrl } from '@/lib/config/seo';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Operator",
    template: "%s | Operator"
  },
  description: "Infrastructure, cybersecurity, and the systems beneath the surface.",
  authors: [{ name: AUTHOR.name, url: AUTHOR.url }],
  creator: AUTHOR.name,
  publisher: AUTHOR.name,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: SITE_NAME,
    url: getCanonicalUrl('/operator', 'operator'),
    description: "Infrastructure, cybersecurity, and the systems beneath the surface.",
    images: [
      {
        url: '/images/og-fallback-operator.png',
        width: 1200,
        height: 630,
        alt: 'Operator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    creator: AUTHOR.twitter,
    site: AUTHOR.twitter,
  },
  alternates: {
    canonical: getCanonicalUrl('/operator', 'operator'),
    languages: {
      en: getCanonicalUrl('/operator', 'operator'),
    },
  },
};

import { Space_Grotesk } from 'next/font/google';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

export default function OperatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${spaceGrotesk.variable} font-persona theme-operator bg-background text-foreground min-h-screen selection:bg-primary/20 selection:text-background flex flex-col`}>
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(rgba(100,140,110,0.007)_1px,transparent_1px),linear-gradient(90deg,rgba(100,140,110,0.007)_1px,transparent_1px)] bg-size-[40px_40px] z-0 opacity-50 dark:opacity-40" />
      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="sticky top-0 z-50 w-full p-4 md:px-6 md:py-4 flex justify-between items-center border-b border-border bg-background/90 backdrop-blur-md">
          <PersonaSwitcher currentPersona="Operator" currentStyle="text-primary font-mono" />
          <div className="flex items-center gap-1 md:gap-2 text-foreground">
            <DesktopNav persona="operator" />
            <PersonaSearch persona="Operator" mobileBgColor="bg-background" />
            <ThemeToggle />
            <MobileNav persona="operator" mobileBgColor="bg-background" />
          </div>
        </header>
        <main className="flex-1">
          {children}
        </main>
        <FooterOperator />
      </div>
    </div>
  );
}
