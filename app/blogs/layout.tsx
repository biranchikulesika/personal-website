import { Metadata } from 'next';
import React from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { PersonaSearch } from '@/components/persona-search';
import { DesktopNav, MobileNav } from '@/components/nav-links';
import { getPersonaUrl } from '@/lib/utils';
import { SITE_URL, getCanonicalUrl } from '@/lib/config/seo';
import { Logo } from '@/components/ui/logo';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Blogs | Biranchi Kulesika',
  description: 'Writing about technology, cybersecurity, philosophy, and life.',
  alternates: {
    canonical: getCanonicalUrl('/blogs'),
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function BlogsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="sticky top-0 z-50 w-full p-4 md:p-6 flex justify-between items-center border-b border-border bg-background/80 backdrop-blur-md">
        <Link href={getPersonaUrl('main')} prefetch={true} className="hover:opacity-70 transition-opacity">
          <Logo />
        </Link>
        <div className="flex items-center gap-1 md:gap-2">
          <DesktopNav persona="main" />
          <PersonaSearch mobileBgColor="bg-background" />
          <ThemeToggle />
          <MobileNav persona="main" mobileBgColor="bg-background" />
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
