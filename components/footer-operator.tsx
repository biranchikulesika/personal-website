'use client';

import Link from 'next/link';
import { getPersonaUrl } from '@/lib/utils';
import { SOCIAL_LINKS } from '@/lib/config/socials';
import { useFooterNewsletter } from '@/hooks/use-footer-newsletter';

export function FooterOperator() {
  const { email, setEmail, status, message, handleSubmit } = useFooterNewsletter('operator');

  return (
    <footer className="w-full border-t border-border bg-background mt-auto py-12 px-4 md:px-6 text-sm text-primary font-mono">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 md:gap-12">
        <div className="flex flex-col gap-8 w-full lg:w-1/2">
          <div className="flex flex-col gap-4">
            <h2 className="font-normal text-primary/80 tracking-widest uppercase text-[10px] md:text-[11px]">[broadcast]</h2>
            <p className="text-primary/90 text-sm">Occasional thoughts on systems, infrastructure, technology, and the internet.</p>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 mt-2 w-full max-w-md flex-wrap">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-muted border border-border text-foreground placeholder:text-foreground/40 px-3 py-2 flex-1 min-w-0 outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all font-mono"
                disabled={status === 'submitting'}
                required
              />
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="border border-border text-primary px-4 py-2 text-xs tracking-widest font-medium whitespace-nowrap text-center hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
              >
                {status === 'submitting' ? <svg className="animate-spin h-4 w-4 mx-auto" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> : status === 'success' ? '[OK]' : 'Subscribe'}
              </button>
              {status === 'error' && (
                <p className="text-red-500/80 text-[10px] mt-1 w-full font-mono">{message}</p>
              )}
            </form>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 md:gap-8 w-full lg:w-1/2">
          <div className="flex flex-col gap-3 text-xs md:text-sm">
            <h2 className="font-normal text-primary/80 mb-3 tracking-widest md:tracking-widest uppercase text-[10px] md:text-[11px] truncate">[directories]</h2>
            <Link href={getPersonaUrl('builder')} prefetch={true} className="hover:text-foreground transition-colors truncate">~/builder</Link>
            <Link href={getPersonaUrl('operator')} prefetch={true} className="hover:text-foreground transition-colors truncate">~/operator</Link>
            <Link href={getPersonaUrl('thinker')} prefetch={true} className="hover:text-foreground transition-colors truncate">~/thinker</Link>
            <Link href={getPersonaUrl('wanderer')} prefetch={true} className="hover:text-foreground transition-colors truncate">~/wanderer</Link>
          </div>
          <div className="flex flex-col gap-3 text-xs md:text-sm">
            <h2 className="font-normal text-primary/80 mb-3 tracking-widest md:tracking-widest uppercase text-[10px] md:text-[11px] truncate">[connections]</h2>
            <a href={SOCIAL_LINKS.github} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors truncate">GitHub</a>
            <a href={SOCIAL_LINKS.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors truncate">LinkedIn</a>
            <a href={SOCIAL_LINKS.twitter} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors truncate">Twitter</a>
            <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors truncate">Instagram</a>
          </div>
          <div className="flex flex-col gap-3 text-xs md:text-sm">
            <h2 className="font-normal text-primary/80 mb-3 tracking-widest md:tracking-widest uppercase text-[10px] md:text-[11px] truncate">[resources]</h2>
            <Link href={getPersonaUrl('operator', '/about')} className="hover:text-foreground transition-colors truncate">About</Link>
            <Link href="#" className="hover:text-foreground transition-colors truncate">Logs</Link>
            <Link href={getPersonaUrl('main', '/fund')} className="hover:text-foreground transition-colors truncate">Support / Fund</Link>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-border text-center flex flex-col items-center justify-center">
        <p className="text-[11px] text-primary/80 tracking-wide">
          © 2026 Biranchi. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
