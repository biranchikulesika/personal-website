import type { Metadata } from 'next';
import Link from 'next/link';
export const dynamic = 'force-static';
import { ThemeToggle } from '@/components/theme-toggle';
import { DesktopNav, MobileNav } from '@/components/nav-links';
import { PersonaSearch } from '@/components/persona-search';
import { Logo } from '@/components/ui/logo';
import { getPersonaUrl } from '@/lib/utils';
import { SOCIAL_LINKS } from '@/lib/config/socials';
import { ProfilePageJsonLd } from '@/components/seo/JsonLd';
import { SITE_URL } from '@/lib/config/seo';

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn more about Biranchi Kulesika — building, thinking, wandering, and observing.',
  openGraph: {
    title: 'About — Biranchi Kulesika',
    description: 'Learn more about Biranchi Kulesika — building, thinking, wandering, and observing.',
  },
};

function CornerCard({ title, subtitle, desc, href }: { title: string; subtitle: string; desc: string; href: string }) {
  return (
    <Link href={href} className={`flex flex-col justify-between group p-5 md:p-7 rounded-2xl border border-border bg-muted/50 hover:bg-muted hover:border-stone-400 dark:hover:border-stone-700 transition-all duration-300 ease-out`}>
      <div className="flex justify-between items-start mb-5 md:mb-8">
        <span className="font-mono text-[10px] tracking-[0.2em] text-primary/80 uppercase">{title}</span>
        <svg className="w-4 h-4 text-primary/80 group-hover:text-foreground transition-colors duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M7 7h10v10" />
        </svg>
      </div>
      <div className="flex flex-col gap-2">
        <span className="font-serif text-xl md:text-2xl text-foreground group-hover:text-foreground transition-colors duration-500 tracking-tight">{subtitle}</span>
        <span className="font-sans font-light text-[15px] md:text-[16px] text-primary/90 group-hover:text-foreground transition-colors duration-500 leading-relaxed">{desc}</span>
      </div>
    </Link>
  );
}

export default function AboutPage() {
  const details = [
    "Linux", "Late nights", "Curiosity", "Journaling", "Writing things down",
    "Pop music", "Observing people", "Landscapes", "Storytelling", "Integrity",
    "Authenticity", "Long walks", "Systems thinking", "Slow internet", "Thoughtful conversations"
  ];

  return (
    <div className="w-full bg-background text-foreground flex flex-col font-sans overflow-x-hidden relative dark:selection:bg-stone-800 selection:bg-stone-300 dark:selection:text-white selection:text-black animate-fade-in">
      <ProfilePageJsonLd
        description="Learn more about Biranchi Kulesika — building, thinking, wandering, and observing."
        url={`${SITE_URL}/about`}
      />
      {/* Global Header */}
      <header className="fixed top-0 w-full p-4 md:p-6 flex justify-between items-center z-50 bg-background/80 backdrop-blur-md border-b border-border">
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

      <main className="flex-1 flex flex-col w-full relative pt-24 md:pt-32">
        {/* Subtle Background Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-100 bg-amber-900/5 blur-[120px] rounded-full pointer-events-none" />

        {/* SECTION 1 — HERO */}
        <section className="px-6 md:px-16 lg:px-24 py-10 sm:py-12 md:py-16 relative z-10 w-full max-w-225 mx-auto">
          <div style={{ animationDelay: '0.1s' }} className="animate-slide-up">
            <span className="font-mono text-[10px] tracking-[0.2em] text-primary/80 uppercase mb-6 md:mb-8 block">
              ABOUT
            </span>
            <h1 className="font-serif text-[1.75rem] sm:text-4xl md:text-5xl lg:text-[4rem] leading-[1.1] text-foreground tracking-tight mb-6 md:mb-10">
              A personal ecosystem shaped by curiosity, systems, stories, and reflection.
            </h1>
            <p className="font-sans font-light text-primary/90 text-lg md:text-xl leading-[1.8] max-w-162.5 mb-6">
              I built this space to separate the different things that continue to occupy my attention. Some corners are focused on systems and technology. Others hold stories, observations, unfinished thoughts, and quieter reflections.
            </p>
            <p className="font-sans font-light text-primary/70 text-[15px] md:text-[16px] max-w-162.5">
              The internet rewards compressed identities. This space exists to resist that.
            </p>
          </div>
        </section>

        {/* SECTION 2 — WHO I AM */}
        <section className="px-6 md:px-16 lg:px-24 py-10 sm:py-12 md:py-16 relative z-10 w-full max-w-225 mx-auto border-t border-border">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-6 md:gap-10 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <h2 className="font-serif text-2xl md:text-3xl text-foreground">Who I am</h2>
            <div className="flex flex-col gap-6 font-sans font-light text-primary/90 text-lg leading-[1.8]">
              <p>
                I spend most of my time thinking about systems, writing things down, exploring technology, and trying to understand how people behave around the tools they create.
              </p>
              <p>
                I&apos;m Biranchi, an Integrated MCA student from Odisha, India. Most of this ecosystem grew from curiosity, observation, experimentation, and the habit of documenting thoughts before they disappear.
              </p>
              <p>
                This space is less about presenting a polished identity and more about documenting an evolving one. I prefer building slowly, thinking carefully, and sharing things that feel honest enough to stay online for a long time.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 3 — WHY THIS EXISTS */}
        <section className="px-6 md:px-16 lg:px-24 py-10 sm:py-12 md:py-16 relative z-10 w-full max-w-225auto border-t border-border">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-6 md:gap-10 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <h2 className="font-serif text-2xl md:text-3xl text-foreground">Why this exists</h2>
            <div className="flex flex-col gap-6 font-sans font-light text-foreground/90 text-lg leading-[1.8]">
              <p>
                The modern internet often rewards speed, noise, and constant performance. I wanted to create something quieter. A space where different parts of my interests could exist without collapsing into one flattened online identity.
              </p>
              <p>
                Each corner of this ecosystem focuses on a different mode of thinking. Together, they form a more complete picture of how I learn, build, observe, and reflect.
              </p>
              <p>
                Some thoughts survive better when they are given their own room.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 4 — THE FOUR CORNERS */}
        <section className="px-6 md:px-16 lg:px-24 py-10 sm:py-12 md:py-16 relative z-10 w-full max-w-275uto border-t border-border">
          <div className="flex flex-col animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-8 md:mb-10 text-center md:text-left">The four corners</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
              <CornerCard
                title="Builder"
                subtitle="Forge"
                desc="Systems, code, workflows, experimentation, and the process of building things carefully over time."
                href={getPersonaUrl('builder', '/')}
              />
              <CornerCard
                title="Operator"
                subtitle="Signal"
                desc="Cybersecurity, infrastructure, digital systems, operational thinking, and understanding what exists beneath interfaces."
                href={getPersonaUrl('operator', '/')}
              />
              <CornerCard
                title="Thinker"
                subtitle="Inside the Head"
                desc="Reflection, psychology, philosophy, overthinking, internal dialogue, and ideas that stay long enough to be written down."
                href={getPersonaUrl('thinker', '/')}
              />
              <CornerCard
                title="Wanderer"
                subtitle="Scribble"
                desc="Stories, memory, travel, lived moments, observations, and fragments collected along the way."
                href={getPersonaUrl('wanderer', '/')}
              />
            </div>
          </div>
        </section>

        {/* SECTION 5 — HOW I USE THE INTERNET */}
        <section className="px-6 md:px-16 lg:px-24 py-10 sm:py-12 md:py-16 relative z-10 w-full max-w-225auto border-t border-border">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-6 md:gap-10 animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <h2 className="font-serif text-2xl md:text-3xl text-foreground">How I use the<br className="hidden md:block"/> internet</h2>
            <div className="flex flex-col gap-6 font-sans font-light text-primary/90 text-lg leading-[1.8]">
              <p>
                I think a lot about digital identity, attention, and how people present themselves online. This ecosystem is my attempt at creating a slower and more intentional presence on the internet.
              </p>
              <p>
                Instead of trying to compress everything into one personality, I prefer separating different interests into different spaces while still keeping them connected to the same human underneath.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 6 — SMALL HUMAN DETAILS */}
        <section className="px-6 md:px-16 lg:px-24 py-8 sm:py-10 md:py-14 relative z-10 w-full max-w-225auto border-t border-border">
          <div className="flex flex-col items-center text-center animate-slide-up" style={{ animationDelay: '0.6s' }}>
            <h2 className="font-mono text-[10px] tracking-[0.2em] text-primary/80 uppercase mb-6 md:mb-8">Small details</h2>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-3 md:gap-x-6 md:gap-y-4 max-w-162.5">
              {details.map((detail, i) => (
                <span key={i} className="font-serif italic text-[17px] md:text-[18px] text-primary/80 transform md:-rotate-1 hover:-translate-y-px opacity-80 hover:opacity-100 transition-all duration-300">
                  {detail}
                </span>
              ))}
            </div>
          </div>
        </section>

      </main>

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
  );
}
