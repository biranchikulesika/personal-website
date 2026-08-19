'use client';

import Link from 'next/link';
import { getPersonaUrl } from '@/lib/utils';
import { SOCIAL_LINKS } from '@/lib/config/socials';
import { useFooterNewsletter } from '@/hooks/use-footer-newsletter';

export function FooterThinker() {
  const { email, setEmail, status, message, handleSubmit } = useFooterNewsletter('thinker');

  return (
    <footer className="w-full border-t border-border bg-background mt-auto py-12 px-4 md:px-6 text-primary font-sans transition-colors duration-1000">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 md:gap-12 text-[13.5px]">
        
        <div className="flex flex-col gap-6 w-full lg:w-1/2 pr-0 md:pr-12">
          <div className="flex flex-col gap-3">
            <h2 className="font-cormorant text-foreground text-[17px] tracking-wide">Letters</h2>
            <p className="text-primary/80 text-[13.5px] leading-[1.8] font-light max-w-sm">Occasional reflections, unfinished thoughts, and quiet observations.</p>
            
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-0 mt-3 w-full max-w-sm border-b border-border pb-1.5 flex-wrap">
              <input
                type="email"
                placeholder="Where should I send them?"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent text-foreground placeholder:text-foreground/40 px-2 py-2 flex-1 min-w-0 outline-none focus:text-foreground transition-colors font-light text-[13.5px] italic"
                disabled={status === 'submitting'}
                required
              />
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="bg-transparent text-primary/80 hover:text-foreground px-4 py-2 text-[13.5px] whitespace-nowrap font-light text-center transition-colors disabled:opacity-50"
              >
                {status === 'submitting' ? <svg className="animate-spin h-4 w-4 mx-auto" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> : status === 'success' ? 'Done' : 'Subscribe'}
              </button>
              {status === 'error' && (
                <p className="text-red-500/80 text-[11px] mt-1.5 w-full font-light italic">{message}</p>
              )}
            </form>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 md:gap-8 w-full lg:w-1/2">
          <div className="flex flex-col gap-3 text-[13.5px] font-light">
            <h2 className="font-cormorant text-foreground text-[16px] mb-1 truncate tracking-wide">Chapters</h2>
            <Link href={getPersonaUrl('builder')} prefetch={true} className="text-primary hover:text-foreground transition-colors duration-500 truncate">Builder</Link>
            <Link href={getPersonaUrl('operator')} prefetch={true} className="text-primary hover:text-foreground transition-colors duration-500 truncate">Operator</Link>
            <Link href={getPersonaUrl('thinker')} prefetch={true} className="text-primary hover:text-foreground transition-colors duration-500 truncate">Thinker</Link>
            <Link href={getPersonaUrl('wanderer')} prefetch={true} className="text-primary hover:text-foreground transition-colors duration-500 truncate">Wanderer</Link>
          </div>
          
          <div className="flex flex-col gap-3 text-[13.5px] font-light">
            <h2 className="font-cormorant text-foreground text-[16px] mb-1 truncate tracking-wide">Presence</h2>
            <a href={SOCIAL_LINKS.github} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-foreground transition-colors duration-500 truncate">GitHub</a>
            <a href={SOCIAL_LINKS.linkedin} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-foreground transition-colors duration-500 truncate">LinkedIn</a>
            <a href={SOCIAL_LINKS.twitter} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-foreground transition-colors duration-500 truncate">Twitter</a>
            <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-foreground transition-colors duration-500 truncate">Instagram</a>
          </div>
          
          <div className="flex flex-col gap-3 text-[13.5px] font-light">
            <h2 className="font-cormorant text-foreground text-[16px] mb-1 truncate tracking-wide">Essays & Notes</h2>
            <Link href={getPersonaUrl('thinker', '/about')} className="text-primary hover:text-foreground transition-colors duration-500 truncate">About</Link>
            <Link href="#" className="text-primary hover:text-foreground transition-colors duration-500 truncate">Writings</Link>
            <Link href="#" className="text-primary hover:text-foreground transition-colors duration-500 truncate">Terms</Link>
            <Link href={getPersonaUrl('main', '/fund')} className="text-primary hover:text-foreground transition-colors duration-500 truncate">Support / Fund</Link>
          </div>
        </div>
        
      </div>
      
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-border text-center flex flex-col items-center justify-center">
        <p className="text-[13px] text-primary/80 font-light">
          &copy; 2026 Biranchi. Cultivating stillness.
        </p>
      </div>
    </footer>
  );
}
