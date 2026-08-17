import Link from 'next/link';
export const dynamic = 'force-static';
import { ThemeToggle } from '@/components/theme-toggle';
import { DesktopNav, MobileNav } from '@/components/nav-links';
import { PersonaSearch } from '@/components/persona-search';
import { Typewriter } from '@/components/typewriter';
import { NewsletterForm } from '@/components/newsletter-form';
import { Logo } from '@/components/ui/logo';
import { getPersonaUrl } from '@/lib/utils';
import { SOCIAL_LINKS } from '@/lib/config/socials';
import { WebSiteJsonLd, ProfilePageJsonLd, OrganizationJsonLd } from '@/components/seo/JsonLd';
import { SITE_URL } from '@/lib/config/seo';
import QUOTES from '@/lib/data/quotes.json';

// Statically pick a quote — deterministic per build, avoids client-side flicker
const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];

function NavCard({ title, subtitle, desc, href }: { title: string; subtitle: string; desc: string; href: string }) {
  return (
    <Link href={href} prefetch={true} className="flex flex-col justify-between group p-4 sm:p-5 md:p-6 lg:p-7 rounded-2xl border border-border bg-muted/50 hover:bg-muted hover:border-border transition-all duration-700 ease-out min-h-27.5 md:min-h-42.5">
      <div className="flex justify-between items-start mb-4 md:mb-8">
        <span className="font-mono text-[9px] md:text-[10px] tracking-[0.2em] text-primary uppercase">{title}</span>
        {/* ArrowUpRight inline SVG to avoid importing lucide on a server component for a single icon */}
        <svg className="w-3.5 h-3.5 text-primary group-hover:text-foreground transition-colors duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M7 7h10v10" />
        </svg>
      </div>
      <div className="flex flex-col gap-1 md:gap-2">
        <span className="font-serif text-[17px] md:text-[19px] text-foreground group-hover:text-foreground transition-colors duration-500 tracking-tight">{subtitle}</span>
        <span className="font-sans font-light text-[13px] md:text-[14px] text-foreground/80 group-hover:text-foreground transition-colors duration-500 leading-snug">{desc}</span>
      </div>
    </Link>
  );
}

function Marquee({ children, reverse = false }: { children: React.ReactNode; reverse?: boolean }) {
  return (
    <div className="relative w-full overflow-hidden whitespace-nowrap py-2.5 md:py-5 border-y border-border bg-background">
      <div className={`flex w-max animate-marquee opacity-60 md:opacity-90 ${reverse ? '[animation-direction:reverse]' : ''}`}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center space-x-10 md:space-x-24 px-5 md:px-12 text-primary font-mono text-[8px] md:text-[10px] tracking-[0.25em] md:tracking-[0.2em] uppercase">
            {children}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="w-full bg-background text-foreground flex flex-col font-sans overflow-x-hidden relative selection:bg-primary/20 animate-fade-in">
      <WebSiteJsonLd />
      <ProfilePageJsonLd url={SITE_URL} />
      <OrganizationJsonLd />

      {/* Global Header */}
      <header className="fixed top-0 w-full p-4 md:p-6 flex justify-between items-center z-50 bg-background/80 backdrop-blur-md border-b border-border">
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

      {/* Viewport Height Cover for Hero + Marquee */}
      <div className="flex flex-col w-full h-auto md:min-h-screen">
        {/* --- Section 1: Hero --- */}
        <section className="flex-1 flex flex-col justify-center px-5 sm:px-8 md:px-16 lg:px-24 pt-20 pb-8 md:pt-36 md:pb-16 relative w-full border-b border-border">
          <div className="mx-auto w-full max-w-300 flex flex-col gap-8 md:gap-16">
            <div className="animate-slide-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
              <h1 className="flex items-center text-[9vw] sm:text-[8vw] md:text-7xl lg:text-[7.5rem] xl:text-[8.5rem] font-serif font-light leading-[1.1] md:leading-[1.05] tracking-tight md:tracking-tighter text-foreground select-none whitespace-normal md:whitespace-nowrap flex-wrap md:flex-nowrap">
                <span className="pr-2.5 md:pr-4">Biranchi</span>
                <span className="relative inline-flex justify-start">
                  <span className="invisible pointer-events-none">Kulesika</span>
                  <span className="absolute inset-y-0 left-0 flex items-center">
                    <Typewriter />
                  </span>
                </span>
              </h1>
            </div>

            <div className="w-full flex justify-start md:-mt-2 animate-slide-up" style={{ animationDelay: '0.6s', animationFillMode: 'both' }}>
              <p className="hidden md:block font-sans font-light text-[21px] text-primary leading-[1.65] w-full max-w-175 text-left tracking-tight">
                A personal ecosystem for building, thinking, writing, and documenting the things that continue to hold my attention.
              </p>
              <p className="block md:hidden font-sans font-light text-[17px] sm:text-[19px] text-primary leading-normal w-full max-w-75 text-left tracking-wide">
                A personal ecosystem for building, thinking, writing, and documenting the things that continue to hold my attention.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5 w-full mt-2 md:mt-6 animate-slide-up" style={{ animationDelay: '0.8s', animationFillMode: 'both' }}>
              <NavCard title="Builder" subtitle="Forge" desc="Code, systems, and technology" href={getPersonaUrl('builder')} />
              <NavCard title="Operator" subtitle="Signal" desc="Cybersecurity and digital infrastructure" href={getPersonaUrl('operator')} />
              <NavCard title="Wanderer" subtitle="Scribble" desc="Stories, travel, and memory" href={getPersonaUrl('wanderer')} />
              <NavCard title="Thinker" subtitle="Inside the Head" desc="Ideas, psychology, and reflection" href={getPersonaUrl('thinker')} />
            </div>
          </div>
        </section>

        {/* --- Marquee --- */}
        <Marquee>
          <span>Build slowly</span>
          <span className="w-1.5 h-1.5 rounded-full bg-border" />
          <span>Clarity over hype</span>
          <span className="w-1.5 h-1.5 rounded-full bg-border" />
          <span>Learn publicly</span>
          <span className="w-1.5 h-1.5 rounded-full bg-border" />
          <span>Attention is a resource</span>
          <span className="w-1.5 h-1.5 rounded-full bg-border" />
        </Marquee>
      </div>

      {/* Viewport Height Cover for Section 2 + Marquee */}
      <div className="flex flex-col w-full h-auto md:min-h-screen">
        {/* --- Section 2: About --- */}
        <section className="flex-1 flex flex-col justify-center px-5 sm:px-6 md:px-16 lg:px-24 pt-10 pb-8 md:pt-20 md:pb-16 border-b border-border relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-200 bg-amber-900-[0.03] sm:bg-amber-900/5 blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-275 mx-auto w-full relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-12 lg:gap-20 xl:gap-24">
            {/* Left Column: Large Quote */}
            <div className="flex-1 lg:pr-8">
              <h2 className="md:hidden font-mono text-[10px] tracking-widest text-primary uppercase mb-4 opacity-70">
                Operating Principles
              </h2>
              <p className="font-serif text-[2.25rem] md:text-[2.5rem] leading-[1.1] sm:text-5xl sm:leading-[1.1] lg:text-6xl lg:leading-[1.1] xl:text-[4.5rem] xl:leading-[1.05] text-foreground tracking-tight max-w-[12em] md:max-w-none mix-blend-plus-lighter">
                {quote}
              </p>
            </div>

            {/* Right Column: Principles List */}
            <div className="w-full md:w-95 lg:w-110 shrink-0 flex flex-col gap-5 md:gap-12 md:border-l border-border md:pl-10 lg:pl-14 relative py-2">
              <h2 className="hidden md:block font-mono text-[10px] tracking-widest text-primary uppercase opacity-70">
                Operating Principles
              </h2>

              <ul className="flex flex-col gap-3.5 sm:gap-6 md:gap-8">
                {[
                  'Be kind. Don\'t be weak.',
                  'Attention is a resource. Protect it.',
                  'Stay curious. Keep learning.',
                  'Small habits shape identity.',
                  'Truth matters even when uncomfortable.',
                ].map((principle, i) => (
                  <li key={i} className="flex items-start gap-4 sm:gap-5">
                    <span className="font-mono text-[10px] text-primary mt-1.5 shrink-0 w-6">0{i + 1}</span>
                    <p className="font-sans font-light text-foreground/80 text-[15px] md:text-lg leading-normal">
                      {principle}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* --- Marquee --- */}
        <Marquee reverse>
          <span>Programming</span>
          <span className="w-1.5 h-1.5 rounded-full dark:bg-stone-800 bg-stone-300" />
          <span>Cybersecurity</span>
          <span className="w-1.5 h-1.5 rounded-full bg-border" />
          <span>Digital Philosophy</span>
          <span className="w-1.5 h-1.5 rounded-full bg-border" />
          <span>Minimal Systems</span>
          <span className="w-1.5 h-1.5 rounded-full bg-border" />
          <span>Psychology</span>
          <span className="w-1.5 h-1.5 rounded-full bg-border" />
        </Marquee>
      </div>

      {/* Viewport Height Cover for Section 3 + Marquee */}
      <div className="flex flex-col w-full relative h-auto md:min-h-screen">
        {/* --- Section 3: Current Focus --- */}
        <section className="flex-1 flex flex-col justify-center px-6 md:px-16 lg:px-24 pt-10 pb-10 md:pt-20 md:pb-16 border-b border-border">
          <div className="max-w-275 mx-auto w-full relative z-10 flex flex-col justify-center h-full">
            <div className="mb-8 md:mb-20">
              <h2 className="font-mono text-[10px] tracking-widest text-primary uppercase mb-4 md:mb-6 opacity-70">
                Current Focus
              </h2>
              <p className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] text-foreground leading-[1.15] mb-4 md:mb-5 max-w-[12em] md:max-w-3xl tracking-tight text-balance md:text-left">
                What I&apos;m building, exploring,<br className="hidden md:block" /> and thinking about.
              </p>
              <p className="font-sans font-light text-primary/80 text-[15px] sm:text-lg max-w-2xl">
                Things that currently occupy my attention.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 md:gap-12 lg:gap-20 w-full">
              {[
                { title: 'Building', items: ['Personal digital ecosystem', 'Minimal web experiences', 'Systems thinking'] },
                { title: 'Exploring', items: ['Digital identity', 'Human attention', 'Long-term thinking'] },
                { title: 'Thinking About', items: ['Meaningful online presence', 'Technology and self-awareness', 'Creating without noise'] },
              ].map((col) => (
                <div key={col.title} className="flex flex-col gap-3 md:gap-6">
                  <h3 className="font-mono text-[10px] tracking-[0.2em] text-primary uppercase">{col.title}</h3>
                  <ul className="flex flex-col gap-2.5 md:gap-3 font-sans font-light text-foreground/90 text-[15px] md:text-base leading-relaxed">
                    {col.items.map(item => (
                      <li key={item} className="flex items-start gap-4">
                        <span className="text-primary/50 text-[10px] mt-1.25 shrink-0">✦</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- Marquee --- */}
        <Marquee>
          <span>Digital Identity</span>
          <span className="w-1.5 h-1.5 rounded-full bg-border" />
          <span>Systems</span>
          <span className="w-1.5 h-1.5 rounded-full bg-border" />
          <span>Psychology</span>
          <span className="w-1.5 h-1.5 rounded-full bg-border" />
          <span>Attention</span>
          <span className="w-1.5 h-1.5 rounded-full bg-border" />
          <span>Minimalism</span>
          <span className="w-1.5 h-1.5 rounded-full bg-border" />
          <span>Programming</span>
          <span className="w-1.5 h-1.5 rounded-full bg-border" />
          <span>Thinking</span>
          <span className="w-1.5 h-1.5 rounded-full bg-border" />
          <span>Philosophy</span>
          <span className="w-1.5 h-1.5 rounded-full bg-border" />
          <span>Creativity</span>
          <span className="w-1.5 h-1.5 rounded-full bg-border" />
          <span>Long-Term Thinking</span>
          <span className="w-1.5 h-1.5 rounded-full bg-border" />
        </Marquee>
      </div>

      {/* Viewport Height Cover for Section 4 + Footer */}
      <div className="flex flex-col w-full relative h-auto md:min-h-screen">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] md:w-150 h-150 bg-amber-900/10 blur-[130px] rounded-full pointer-events-none opacity-50" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-screen h-100 bg-amber-950/20 blur-[150px] rounded-[100%] pointer-events-none opacity-40 mix-blend-screen" />

        {/* --- Section 4: Newsletter Invitation --- */}
        <section className="flex-1 flex flex-col justify-center px-6 md:px-16 lg:px-24 w-full relative z-10 pt-10 pb-8 md:pb-16 md:pt-0">
          <div className="w-full max-w-275 mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-8 md:gap-12 lg:gap-20 xl:gap-24">
            {/* Left text column */}
            <div className="flex-1 flex flex-col text-left lg:pr-8">
              <h2 className="font-mono text-[9px] md:text-[10px] tracking-[0.3em] text-primary uppercase mb-4 md:mb-6 opacity-70">
                Choose Your Corners
              </h2>
              <h3 className="font-serif text-3xl sm:text-4xl md:text-[2.75rem] lg:text-[3.25rem] text-foreground mb-3 md:mb-5 tracking-tight leading-[1.1]">
                Choose what you want to hear about.
              </h3>
              <p className="font-sans font-light text-foreground/90 text-[15px] sm:text-[17px] leading-relaxed max-w-md">
                Thoughts, systems, stories, and ideas that stay with me long enough to write about.
              </p>
            </div>

            {/* Right form column */}
            <div className="w-full md:w-95 lg:w-105 shrink-0 flex flex-col mx-auto lg:mx-0">
              <NewsletterForm />
            </div>
          </div>
        </section>

        {/* Global Footer */}
        <footer className="w-full px-6 md:px-16 lg:px-24 py-6 md:py-10 flex flex-col md:flex-row justify-center items-center gap-5 md:gap-6 z-50 bg-transparent border-t border-border">
          <a href={SOCIAL_LINKS.github} target="_blank" rel="noreferrer" className="font-sans font-light text-[14px] text-muted-text hover:text-foreground transition-colors duration-500">
            GitHub
          </a>
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-text/60">
            India · 2026
          </span>
          <a href={SOCIAL_LINKS.email} className="font-sans font-light text-[14px] text-muted-text hover:text-foreground transition-colors duration-500">
            Email
          </a>
        </footer>
      </div>
    </div>
  );
}
