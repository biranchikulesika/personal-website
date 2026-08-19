'use client';

import { useState, useCallback } from 'react';
import { ArrowRight } from 'lucide-react';
import { subscribeNewsletter } from '@/app/actions/public.actions';

const newsletters = [
  { id: 'builder', persona: 'Builder', name: 'Forge', desc: 'code, systems, technology' },
  { id: 'operator', persona: 'Operator', name: 'Signal', desc: 'cybersecurity and digital infrastructure' },
  { id: 'thinker', persona: 'Thinker', name: 'Inside the Head', desc: 'philosophy, psychology, ideas' },
  { id: 'wanderer', persona: 'Wanderer', name: 'Scribble', desc: 'stories, travel, life experiences' },
];

export function NewsletterForm({ defaultPersona }: { defaultPersona?: string }) {
  const [selectedTopics, setSelectedTopics] = useState<string[]>(
    defaultPersona ? [defaultPersona] : ['thinker', 'wanderer']
  );
  const [emailValue, setEmailValue] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isGridMode, setIsGridMode] = useState(false);
  const [gridOpacity, setGridOpacity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleFocusChange = useCallback((focused: boolean) => {
    setIsInputFocused(focused);
    if (focused !== isGridMode && !defaultPersona) {
      setGridOpacity(0);
      setTimeout(() => {
        setIsGridMode(focused);
        setTimeout(() => {
          setGridOpacity(1);
        }, 50);
      }, 150);
    }
  }, [isGridMode, defaultPersona]);

  const toggleTopic = useCallback((cat: string) => {
    if (defaultPersona) return;
    setSelectedTopics(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  }, [defaultPersona]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValue || selectedTopics.length === 0) return;
    
    setIsSubmitting(true);
    setError('');
    
    const result = await subscribeNewsletter(emailValue, selectedTopics, defaultPersona || 'main');
    
    setIsSubmitting(false);
    if (result.success) {
      setIsSubmitted(true);
      setEmailValue('');
      setTimeout(() => setIsSubmitted(false), 5000);
    } else {
      setError(result.error || 'Failed to subscribe');
    }
  }, [emailValue, selectedTopics, defaultPersona]);

  return (
    <form className="w-full flex flex-col" onSubmit={handleSubmit}>
      {!defaultPersona && (
        <div
          className={`flex flex-col md:flex-col w-full sm:gap-1.5 md:mb-14 ${isGridMode ? 'max-md:grid max-md:grid-cols-2 max-md:gap-2 max-md:mb-4' : 'max-md:gap-0.5 max-md:mb-8'}`}
          style={{ opacity: gridOpacity, transition: 'opacity 150ms ease-out' }}
        >
          {newsletters.map(nl => {
            const isSelected = selectedTopics.includes(nl.id);
            return (
              <button
                key={nl.id}
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                }}
                onClick={() => toggleTopic(nl.id)}
                className={`group flex items-start md:p-3.5 rounded-xl transition-colors duration-400 text-left bg-muted/30 hover:bg-muted/80 relative md:-ml-3.5 md:w-[calc(100%+28px)] ${
                  isGridMode
                    ? 'max-md:p-2.5 max-md:w-full max-md:border border-border'
                    : 'max-md:p-3 max-md:-ml-3 max-md:w-[calc(100%+24px)]'
                }`}
              >
                <div className={`shrink-0 w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center transition-all duration-300 mt-1.75 mr-3.5 ${isSelected ? 'bg-primary border-primary text-background' : 'border-border group-hover:border-primary'}`}>
                  {isSelected && <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
                <div className="flex flex-col relative w-full overflow-hidden">
                  <div className="flex flex-col relative -top-px w-full">
                    <span className={`font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.25em] transition-all duration-400 ease-out block origin-top w-full overflow-hidden ${isSelected ? 'text-primary' : 'text-primary/70 group-hover:text-primary'} ${isGridMode ? 'max-md:opacity-0 max-md:max-h-0' : 'max-md:opacity-100 max-md:max-h-5 max-md:mb-1.5 md:mb-1'}`}>{nl.persona}</span>
                    <p className="font-serif text-[16px] sm:text-[19px] leading-tight mt-0 md:mt-0 tracking-tight flex flex-wrap items-baseline md:gap-y-1 w-full">
                      <span className={`transition-colors duration-300 w-full md:w-auto ${isSelected ? 'text-foreground' : 'text-foreground/70 group-hover:text-foreground'}`}>{nl.name}</span>
                      <span className="text-primary/60 mx-2.5 font-sans hidden sm:inline">·</span>
                      <span className={`font-sans text-[13px] sm:text-[15px] font-light w-full sm:w-auto inline-block sm:inline overflow-hidden transition-all duration-400 ease-out origin-top ${isSelected ? 'text-primary' : 'text-primary/70 group-hover:text-primary'} ${isGridMode ? 'max-md:opacity-0 max-md:max-h-0' : 'max-md:opacity-100 max-md:max-h-7.5 max-md:mt-0.5'}`}>{nl.desc}</span>
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {isSubmitted ? (
        <div className="w-full py-4 bg-primary/10 text-primary rounded-md text-center font-mono text-[11px] mb-6">
          Thank you for subscribing.
        </div>
      ) : (
        <>
          <div className={`relative group w-full mb-6 max-md:mt-2 ${isInputFocused ? 'max-md:-translate-y-2' : ''} transition-transform duration-500`}>
            <input
              type="email"
              name="newsletter-email"
              id="newsletter-email"
              autoComplete="email"
              data-1p-ignore="true"
              data-lpignore="true"
              value={emailValue}
              onChange={(e) => setEmailValue(e.target.value)}
              placeholder="Enter your email address"
              onFocus={() => handleFocusChange(true)}
              onBlur={() => handleFocusChange(false)}
              className="w-full bg-transparent border-b border-border px-1 py-4 text-foreground focus:outline-none focus:border-primary transition-colors duration-500 font-sans text-[16px] font-light placeholder:text-primary/80 rounded-none shadow-none"
              disabled={isSubmitting}
              required
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-primary hover:text-foreground transition-colors active:scale-95 disabled:opacity-50"
              aria-label="Subscribe"
            >
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.5]" />
            </button>
          </div>
          {error && <p className="text-red-500 font-sans text-xs mb-2">{error}</p>}
          <p className="text-primary font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.2em] opacity-60 ml-1">
            Low frequency. High signal.
          </p>
        </>
      )}
    </form>
  );
}
