import Link from 'next/link';
import { SOCIAL_LINKS } from '@/lib/config/socials';

export function FooterMain() {
  return (
    <footer className="w-full px-6 md:px-16 lg:px-24 py-6 md:py-10 flex flex-col md:flex-row justify-center items-center gap-5 md:gap-6 z-50 bg-transparent border-t border-border">
      <a href={SOCIAL_LINKS.github} target="_blank" rel="noreferrer" className="font-sans font-light text-[14px] text-primary/80 hover:text-foreground transition-colors duration-500">
        GitHub
      </a>
      <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-primary/40">
        India · 2026
      </span>
      <a href={SOCIAL_LINKS.email} className="font-sans font-light text-[14px] text-primary/80 hover:text-foreground transition-colors duration-500">
        Email
      </a>
    </footer>
  );
}
