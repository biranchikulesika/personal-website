import type { Metadata } from 'next';
import Link from 'next/link';
export const dynamic = 'force-static';
import { getPersonaUrl } from '@/lib/utils';
import { DesktopNav, MobileNav } from '@/components/nav-links';
import { PersonaSearch } from '@/components/persona-search';
import { ThemeToggle } from '@/components/theme-toggle';
import { Logo } from '@/components/ui/logo';
import { SITE_URL, getCanonicalUrl } from '@/lib/config/seo';
import { FooterMain } from '@/components/footer-main';
import { SOCIAL_LINKS } from '@/lib/config/socials';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Terms & Conditions | Biranchi Kulesika",
  description: "Terms and conditions for this website.",
  alternates: {
    canonical: getCanonicalUrl('/terms'),
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsPage() {
  return (
    <div className="w-full min-h-screen bg-background text-foreground flex flex-col font-sans overflow-x-hidden relative selection:bg-primary/20">
      {/* Global Header */}
      <header className="fixed top-0 w-full p-4 md:px-6 md:py-4 flex justify-between items-center z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <Link href={getPersonaUrl('main')} className="hover:opacity-70 transition-opacity">
          <Logo />
        </Link>
        <div className="flex items-center gap-1 md:gap-2">
          <DesktopNav persona="main" />
          <PersonaSearch mobileBgColor="bg-background" />
          <ThemeToggle />
          <MobileNav persona="main" mobileBgColor="bg-background" />
        </div>
      </header>

      <main className="flex-1 flex flex-col w-full relative pt-24 md:pt-32 px-6 md:px-16 lg:px-24 py-10 sm:py-12 max-w-225 mx-auto z-10">
        <span className="font-mono text-[10px] tracking-[0.2em] text-primary/80 uppercase mb-6 md:mb-8 block">
          AGREEMENTS
        </span>
        <h1 className="font-serif text-[1.75rem] sm:text-4xl md:text-5xl lg:text-[4rem] leading-[1.1] text-foreground tracking-tight mb-6 md:mb-10">
          Terms & Conditions
        </h1>
        <div className="font-sans font-light text-primary/90 text-lg leading-[1.8] flex flex-col gap-6">
          <p>
            This page outlines the terms, conditions, and agreements for engaging with the content, projects, and resources available across the Builder, Operator, Thinker, and Wanderer personas.
          </p>
          <p>
            The content is provided for informational and educational purposes. While every effort is made to ensure accuracy, the materials are provided &quot;as is&quot; without any guarantees. 
          </p>
          <p>
            Please check back as these terms are subject to change as the ecosystem evolves.
          </p>
        </div>
      </main>

      {/* Global Footer */}
      <FooterMain />
    </div>
  );
}
