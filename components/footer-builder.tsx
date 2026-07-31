'use client';

import Link from 'next/link';
import { getPersonaUrl } from '@/lib/utils';
import { SOCIAL_LINKS } from '@/lib/config/socials';
import { useFooterNewsletter } from '@/hooks/use-footer-newsletter';

export function FooterBuilder() {
  const { email, setEmail, status, message, handleSubmit } = useFooterNewsletter('builder');

  return (
    <footer className="w-full border-t border-border bg-background mt-auto py-12 px-4 md:px-6 text-sm text-primary">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 md:gap-12 text-sm md:text-base">
        <div className="flex flex-col gap-8 w-full lg:w-1/2">
          <div className="flex flex-col gap-4">
            <h2 className="font-semibold text-foreground uppercase tracking-wider text-xs">Newsletter</h2>
            <p className="text-primary/80 text-sm">Stay updated with the latest builds, deployments, and architectures.</p>              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 mt-2 w-full max-w-md flex-wrap">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-muted border border-border text-foreground placeholder:text-foreground/40 px-3 py-2 rounded flex-1 min-w-0 outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                disabled={status === 'submitting'}
                required
              />
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="bg-muted text-foreground px-5 py-2 rounded font-medium whitespace-nowrap text-center hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
              >
                {status === 'submitting' ? <svg className="animate-spin h-4 w-4 mx-auto" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> : status === 'success' ? 'Done' : 'Join'}
              </button>
              {status === 'error' && (
                <p className="text-red-500/80 text-[11px] w-full mt-1">{message}</p>
              )}
            </form>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 md:gap-8 w-full lg:w-1/2">
          <div className="flex flex-col gap-3 text-xs md:text-sm">
            <h2 className="font-semibold text-foreground mb-2 uppercase tracking-wider text-[10px] md:text-xs">Folders</h2>
            <Link href={getPersonaUrl('builder')} prefetch={true} className="hover:text-foreground transition-colors truncate">Builder</Link>
            <Link href={getPersonaUrl('operator')} prefetch={true} className="hover:text-foreground transition-colors truncate">Operator</Link>
            <Link href={getPersonaUrl('thinker')} prefetch={true} className="hover:text-foreground transition-colors truncate">Thinker</Link>
            <Link href={getPersonaUrl('wanderer')} prefetch={true} className="hover:text-foreground transition-colors truncate">Wanderer</Link>
          </div>
          <div className="flex flex-col gap-3 text-xs md:text-sm">
            <h2 className="font-semibold text-foreground mb-2 uppercase tracking-wider text-[10px] md:text-xs">Social</h2>
            <a href={SOCIAL_LINKS.github} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors truncate">GitHub</a>
            <a href={SOCIAL_LINKS.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors truncate">LinkedIn</a>
            <a href={SOCIAL_LINKS.twitter} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors truncate">Twitter</a>
            <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors truncate">Instagram</a>
          </div>
          <div className="flex flex-col gap-3 text-xs md:text-sm">
            <h2 className="font-semibold text-foreground mb-2 uppercase tracking-wider text-[10px] md:text-xs truncate">Legal & Resources</h2>
            <Link href={getPersonaUrl('builder', '/about')} className="hover:text-foreground transition-colors truncate">About</Link>
            <Link href="#" className="hover:text-foreground transition-colors truncate">Blogs / Writes</Link>
            <Link href="#" className="hover:text-foreground transition-colors truncate">Terms</Link>
            <Link href={getPersonaUrl('main', '/fund')} className="hover:text-foreground transition-colors truncate">Support / Fund</Link>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-border text-center text-xs text-primary">
        &copy; 2026 Biranchi. All rights reserved.
      </div>
    </footer>
  );
}
