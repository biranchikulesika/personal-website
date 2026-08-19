'use client';

import Link from 'next/link';
import { getPersonaUrl } from '@/lib/utils';
import { SOCIAL_LINKS } from '@/lib/config/socials';
import { useFooterNewsletter } from '@/hooks/use-footer-newsletter';

export function FooterWanderer() {
  const { email, setEmail, status, message, handleSubmit } = useFooterNewsletter('wanderer');

  return (
    <footer className="w-full border-t border-border bg-background mt-auto py-12 px-4 md:px-6 text-sm text-primary font-spectral relative">
      <div className="absolute inset-0 pointer-events-none dark:bg-[radial-gradient(ellipse_at_30%_0%,rgba(28,24,21,0.4)_0%,transparent_70%)] bg-[radial-gradient(ellipse_at_30%_0%,rgba(238,231,222,0.8)_0%,transparent_70%)]" />
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 md:gap-12 text-sm md:text-base relative z-10">
        <div className="flex flex-col gap-8 w-full lg:w-1/2">
          <div className="flex flex-col gap-4">
            <h2 className="font-sans font-medium uppercase tracking-[0.15em] text-primary/80 text-xs">THE DISPATCH</h2>
            <p className="text-primary font-spectral text-sm">Occasional stories, reflections, observations, and fragments from the journey.</p>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 mt-2 w-full max-w-md flex-wrap">
              <input
                type="email"
                placeholder="Where should I send the letters?"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent border border-border text-foreground placeholder:text-foreground/40 px-3 py-2 flex-1 min-w-0 outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-all font-spectral italic text-sm md:text-base"
                disabled={status === 'submitting'}
                required
              />
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="border border-border text-primary hover:text-background hover:bg-foreground px-5 py-2 font-spectral italic text-sm md:text-base whitespace-nowrap text-center transition-colors disabled:opacity-50"
              >
                {status === 'submitting' ? <svg className="animate-spin h-4 w-4 mx-auto" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> : status === 'success' ? 'Done' : 'Subscribe'}
              </button>
              {status === 'error' && (
                <p className="text-red-500/80 text-[11px] mt-1 w-full font-spectral italic">{message}</p>
              )}
            </form>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 md:gap-8 w-full lg:w-1/2">
          <div className="flex flex-col gap-3 text-xs md:text-sm">
            <h2 className="font-sans font-medium mb-2 text-primary/80 uppercase tracking-[0.15em] text-[10px] md:text-xs truncate">Volumes</h2>
            <Link href={getPersonaUrl('builder')} prefetch={true} className="text-primary hover:text-foreground transition-colors truncate">Vol I: Builder</Link>
            <Link href={getPersonaUrl('operator')} prefetch={true} className="text-primary hover:text-foreground transition-colors truncate">Vol II: Operator</Link>
            <Link href={getPersonaUrl('thinker')} prefetch={true} className="text-primary hover:text-foreground transition-colors truncate">Vol III: Thinker</Link>
            <Link href={getPersonaUrl('wanderer')} prefetch={true} className="text-primary hover:text-foreground transition-colors truncate">Vol IV: Wanderer</Link>
          </div>
          <div className="flex flex-col gap-3 text-xs md:text-sm">
            <h2 className="font-sans font-medium mb-2 text-primary/80 uppercase tracking-[0.15em] text-[10px] md:text-xs truncate">Artifacts</h2>
            <a href={SOCIAL_LINKS.github} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-foreground transition-colors truncate">GitHub</a>
            <a href={SOCIAL_LINKS.linkedin} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-foreground transition-colors truncate">LinkedIn</a>
            <a href={SOCIAL_LINKS.twitter} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-foreground transition-colors truncate">Twitter</a>
            <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-foreground transition-colors truncate">Instagram</a>
          </div>
          <div className="flex flex-col gap-3 text-xs md:text-sm">
            <h2 className="font-sans font-medium mb-2 text-primary/80 uppercase tracking-[0.15em] text-[10px] md:text-xs truncate">Index</h2>
            <Link href={getPersonaUrl('wanderer', '/about')} className="text-primary hover:text-foreground transition-colors truncate">About</Link>
            <Link href="#" className="text-primary hover:text-foreground transition-colors truncate">Journal</Link>
            <Link href="#" className="text-primary hover:text-foreground transition-colors truncate">Agreements</Link>
            <Link href={getPersonaUrl('main', '/fund')} className="text-primary hover:text-foreground transition-colors truncate">Patronage / Fund</Link>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-12 md:mt-16 pt-8 border-t border-border text-center flex flex-col items-center justify-center relative z-10">
        <p className="text-xs md:text-sm text-primary tracking-wide font-spectral italic opacity-80">
          &copy; 2026 Biranchi. Wanderer Edition.
        </p>
      </div>
    </footer>
  );
}
